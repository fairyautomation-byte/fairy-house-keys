import { queueLicenseEmail, deliverLicenseEmail } from "@/lib/notifications";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { isAdminAuthenticated } from "@/lib/auth";
import { generateKey } from "@/lib/key-generator";
import { validPlan, licenseData } from "@/lib/order-service";
import { ApiError, failure, activeUser } from "@/lib/security";
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (!(await isAdminAuthenticated(req)))
      throw new ApiError(401, "Unauthorized");
    const { id } = await params,
      ref = db.collection("orders").doc(id),
      licenseRef = db.collection("licenses").doc(`order_${id}`),
      key = generateKey();
    const result = await db.runTransaction(
      async (tx) => {
        const snap = await tx.get(ref),
          order = snap.data();
        if (!order) throw new ApiError(404, "ORDER_NOT_FOUND");
        if (order.status === "PAID" && order.license_key)
          return { licenseKey: order.license_key, duplicate: true };
        if (order.status !== "PENDING_PAYMENT_REVIEW")
          throw new ApiError(409, "ORDER_NOT_PENDING");
        const [user, planSnap] = await Promise.all([
          tx.get(db.collection("users").doc(order.user_id)),
          tx.get(db.collection("plans").doc(order.plan_id)),
        ]);
        if (
          !user.exists ||
          !activeUser(user.data()) ||
          user.data()!.email_verified !== true
        )
          throw new ApiError(403, "ACCOUNT_NOT_VERIFIED");
        const plan = validPlan(order.plan_snapshot || planSnap.data());
        if (plan.price !== order.amount)
          throw new ApiError(409, "PLAN_AMOUNT_MISMATCH");
        tx.set(
          licenseRef,
          licenseData(order.user_id, order.plan_id, plan, key),
        );
        queueLicenseEmail(tx, `order_${id}`, order.user_id, licenseRef.id);
        tx.update(ref, {
          status: "PAID",
          paid_at: new Date(),
          license_key: key,
          license_id: licenseRef.id,
        });
        tx.set(db.collection("admin_audit").doc(), {
          action: "APPROVE_ORDER",
          order_id: id,
          created_at: new Date(),
        });
        return { licenseKey: key, duplicate: false };
      },
      { maxAttempts: 20 },
    );
    await deliverLicenseEmail(`order_${id}`);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return failure(error);
  }
}
