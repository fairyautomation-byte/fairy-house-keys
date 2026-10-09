import { NextRequest, NextResponse } from "next/server";
import { randomInt, randomUUID } from "node:crypto";
import { payos } from "@/lib/payos";
import { db } from "@/lib/firebase";
import { getAuthenticatedUser } from "@/lib/auth";
import { validPlan, planIds } from "@/lib/order-service";
import {
  jsonBody,
  failure,
  ApiError,
  digest,
  activeUser,
} from "@/lib/security";
import { checkRateLimit } from "@/lib/rate-limit";
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) throw new ApiError(401, "Unauthorized");
    if (!(await checkRateLimit(`payment-create:${user.uid}`, 5, 60)).allowed)
      throw new ApiError(429, "RATE_LIMIT_EXCEEDED");
    const body = await jsonBody(req),
      planId = body.planId;
    if (planId && (!planIds.includes(planId) || planId === "trial"))
      throw new ApiError(400, "INVALID_PLAN");
    const requestId = body.requestId;
    if (
      typeof requestId !== "string" ||
      !/^[a-zA-Z0-9_-]{16,128}$/.test(requestId)
    )
      throw new ApiError(400, "REQUEST_ID_REQUIRED");
    const plan = planId
      ? validPlan((await db.collection("plans").doc(planId).get()).data())
      : null;
    const amount = plan ? plan.price : body.amount;
    if (!Number.isSafeInteger(amount) || amount < 10000 || amount > 100000000)
      throw new ApiError(400, "INVALID_AMOUNT");
    const origin = new URL(
      process.env.NEXT_PUBLIC_APP_URL ||
        process.env.NEXT_PUBLIC_BASE_URL ||
        req.url,
    ).origin;
    for (const url of [body.returnUrl, body.cancelUrl])
      if (url && new URL(url).origin !== origin)
        throw new ApiError(400, "INVALID_REDIRECT");
    const ref = db
        .collection("payos_orders")
        .doc(digest(`${user.uid}:${requestId}`)),
      orderCode = randomInt(100000000000, 999999999999),
      transactionCode = `FH${randomUUID().replace(/-/g, "").slice(0, 16).toUpperCase()}`;
    const reservation = db
      .collection("payos_order_codes")
      .doc(String(orderCode));
    const result: FirebaseFirestore.DocumentData = await db.runTransaction(
      async (tx) => {
        const [existing, reserved, owner] = await Promise.all([
          tx.get(ref),
          tx.get(reservation),
          tx.get(db.collection("users").doc(user.uid)),
        ]);
        if (!activeUser(owner.data()) || owner.data()?.email_verified !== true)
          throw new ApiError(403, "ACCOUNT_NOT_VERIFIED");
        if (existing.exists) {
          if (
            existing.data()!.amount !== amount ||
            existing.data()!.plan_id !== (planId || null)
          )
            throw new ApiError(409, "REQUEST_ID_CONFLICT");
          return existing.data()!;
        }
        if (reserved.exists) throw new ApiError(409, "ORDER_CODE_COLLISION");
        const data = {
          payosOrderCode: orderCode,
          transactionCode,
          userId: user.uid,
          amount,
          status: "CREATING",
          type: plan ? "PURCHASE" : "DEPOSIT",
          plan_id: planId || null,
          plan_snapshot: plan,
          created_at: new Date(),
        };
        tx.set(ref, data);
        tx.set(reservation, { order_id: ref.id });
        return data;
      },
      { maxAttempts: 20 },
    );
    if (result.payment) return NextResponse.json(result.payment);
    // Provider uses the reserved code, so retries can recover the same payment instead of creating another.
    const paymentData = {
      orderCode: result.payosOrderCode,
      amount: result.amount,
      description: String(result.payosOrderCode),
      returnUrl: `${origin}${plan ? "/dashboard/licenses" : "/dashboard/wallet"}`,
      cancelUrl: `${origin}${plan ? "/checkout" : "/dashboard/wallet"}`,
      expiredAt: Math.floor(Date.now() / 1000) + 300,
    };
    let link;
    try {
      link = await payos.createPaymentLink(paymentData);
    } catch {
      link = await payos.getPaymentLinkInformation(result.payosOrderCode);
      if (!(link as any).checkoutUrl || !(link as any).qrCode)
        throw new ApiError(503, "PAYMENT_LINK_RETRY_REQUIRED");
    }
    const payment = {
      checkoutUrl: (link as any).checkoutUrl,
      qrCode: (link as any).qrCode,
      orderCode: result.payosOrderCode,
      bin: (link as any).bin,
      accountNumber: (link as any).accountNumber,
      accountName: (link as any).accountName,
      amount: result.amount,
      description: (link as any).description || String(result.payosOrderCode),
      transactionCode: result.transactionCode,
    };
    await db.runTransaction(
      async (tx) => {
        const current = await tx.get(ref);
        tx.update(ref, {
          payment,
          paymentLinkId: (link as any).paymentLinkId || "",
          ...(current.data()?.status === "CREATING"
            ? { status: "PENDING" }
            : {}),
        });
      },
      { maxAttempts: 20 },
    );
    return NextResponse.json(payment);
  } catch (error) {
    return failure(error);
  }
}
