import { queueLicenseEmail } from "./notifications";
import { db } from "./firebase";
import { generateKey } from "./key-generator";
import { ApiError, digest, activeUser } from "./security";
import { vietnamDay } from "./license-service";
export const planIds = ["trial", "monthly", "quarterly", "yearly"];
export function validPlan(data: any) {
  if (
    !data ||
    data.active === false ||
    !Number.isSafeInteger(data.price) ||
    data.price < 0 ||
    !(
      data.duration === null ||
      (Number.isSafeInteger(data.duration) && data.duration > 0)
    ) ||
    !(
      data.scanLimit === null ||
      (Number.isSafeInteger(data.scanLimit) && data.scanLimit >= -1)
    )
  )
    throw new ApiError(400, "INVALID_PLAN");
  return {
    price: data.price,
    duration: data.duration,
    scanLimit: data.scanLimit,
  };
}
export function licenseData(
  uid: string,
  planId: string,
  plan: any,
  key: string,
) {
  const now = new Date();
  return {
    license_key: key,
    user_id: uid,
    plan_id: planId,
    status: "ACTIVE",
    created_at: now,
    activated_at: now,
    expires_at:
      plan.duration === null
        ? null
        : new Date(now.getTime() + plan.duration * 86400000),
    daily_limit: plan.scanLimit,
    daily_used: 0,
    total_scans: 0,
    last_reset_date: vietnamDay(now),
  };
}
export async function buyWithWallet(
  uid: string,
  planId: string,
  requestId: string,
) {
  if (!planIds.includes(planId) || !/^[a-zA-Z0-9_-]{16,128}$/.test(requestId))
    throw new ApiError(400, "INVALID_REQUEST");
  const userRef = db.collection("users").doc(uid),
    orderRef = db
      .collection("orders")
      .doc(digest(`wallet:${uid}:${requestId}`)),
    licenseRef = db.collection("licenses").doc(orderRef.id),
    key = generateKey();
  return db.runTransaction(
    async (tx) => {
      const [userSnap, old, planSnap] = await Promise.all([
        tx.get(userRef),
        tx.get(orderRef),
        tx.get(db.collection("plans").doc(planId)),
      ]);
      const user = userSnap.data();
      if (
        !userSnap.exists ||
        !activeUser(user) ||
        user!.email_verified !== true
      )
        throw new ApiError(403, "ACCOUNT_NOT_VERIFIED");
      if (old.exists) {
        if (old.data()!.plan_id !== planId)
          throw new ApiError(409, "REQUEST_ID_CONFLICT");
        return {
          ok: true,
          licenseKey: old.data()!.license_key,
          newBalance: user!.wallet_balance || 0,
          duplicate: true,
        };
      }
      const plan = validPlan(planSnap.data());
      if (planId === "trial" && user!.trial_used)
        throw new ApiError(403, "TRIAL_ALREADY_USED");
      const balance = Number(user!.wallet_balance || 0);
      if (!Number.isSafeInteger(balance) || balance < plan.price)
        throw new ApiError(400, "INSUFFICIENT_FUNDS");
      if (planId === "trial" && plan.price !== 0)
        throw new ApiError(400, "INVALID_TRIAL_PRICE");
      tx.update(userRef, {
        wallet_balance: balance - plan.price,
        ...(planId === "trial" ? { trial_used: true } : {}),
      });
      tx.set(licenseRef, licenseData(uid, planId, plan, key));
      queueLicenseEmail(tx, orderRef.id, uid, licenseRef.id);
      tx.set(orderRef, {
        user_id: uid,
        plan_id: planId,
        plan_snapshot: plan,
        amount: plan.price,
        status: "PAID",
        payment_method: "WALLET",
        transaction_code: `FH${orderRef.id.slice(0, 16).toUpperCase()}`,
        license_key: key,
        license_id: licenseRef.id,
        created_at: new Date(),
        paid_at: new Date(),
      });
      return {
        ok: true,
        licenseKey: key,
        newBalance: balance - plan.price,
        duplicate: false,
      };
    },
    { maxAttempts: 20 },
  );
}
export async function settlePayment(
  orderCode: number,
  amount: number,
  reference: string,
) {
  const query = await db
    .collection("payos_orders")
    .where("payosOrderCode", "==", orderCode)
    .limit(2)
    .get();
  if (query.size !== 1) throw new ApiError(409, "PAYMENT_ORDER_NOT_UNIQUE");
  const ref = query.docs[0].ref,
    key = generateKey(),
    ledgerRef = db.collection("orders").doc(`payos_${orderCode}`),
    licenseRef = db.collection("licenses").doc(`payos_${orderCode}`);
  return db.runTransaction(
    async (tx) => {
      const snap = await tx.get(ref),
        order = snap.data()!;
      if (order.amount !== amount)
        throw new ApiError(400, "PAYMENT_AMOUNT_MISMATCH");
      if (order.status === "PAID")
        return { duplicate: true, licenseKey: order.license_key || null };
      if (
        ![
          "CREATING",
          "PENDING",
          "CANCELED",
          "EXPIRED",
          "CREATE_FAILED",
        ].includes(order.status)
      )
        throw new ApiError(409, "PAYMENT_STATE_INVALID");
      const userRef = db.collection("users").doc(order.userId),
        userSnap = await tx.get(userRef),
        user = userSnap.data();
      if (!userSnap.exists) throw new ApiError(409, "PAYMENT_USER_MISSING");
      const oldLedger = await tx.get(ledgerRef);
      if (oldLedger.exists) throw new ApiError(409, "PAYMENT_LEDGER_CONFLICT");
      const purchase = order.type === "PURCHASE";
      // A deleted/suspended account still gets an accounting credit, never an active license.
      const fulfill =
        purchase && activeUser(user) && user!.email_verified === true;
      const plan = purchase
        ? validPlan({ ...order.plan_snapshot, active: true })
        : null;
      if (purchase && plan!.price !== amount)
        throw new ApiError(409, "PAYMENT_PLAN_MISMATCH");
      const balance = Number(user!.wallet_balance || 0);
      if (!Number.isSafeInteger(balance))
        throw new ApiError(409, "INVALID_BALANCE");
      if (fulfill) {
        tx.set(licenseRef, licenseData(order.userId, order.plan_id, plan, key));
        queueLicenseEmail(tx, ledgerRef.id, order.userId, licenseRef.id);
      } else tx.update(userRef, { wallet_balance: balance + amount });
      tx.set(ledgerRef, {
        user_id: order.userId,
        plan_id: fulfill ? order.plan_id : null,
        type: fulfill ? "PURCHASE" : "DEPOSIT",
        amount,
        status: "PAID",
        payment_method: "PAYOS",
        payos_order_code: orderCode,
        transaction_code: order.transactionCode,
        license_key: fulfill ? key : null,
        created_at: new Date(),
        paid_at: new Date(),
      });
      tx.update(ref, {
        status: "PAID",
        paid_at: new Date(),
        reference,
        license_key: fulfill ? key : null,
        fulfillment: fulfill ? "LICENSE" : "WALLET",
      });
      return { duplicate: false, licenseKey: fulfill ? key : null };
    },
    { maxAttempts: 20 },
  );
}
