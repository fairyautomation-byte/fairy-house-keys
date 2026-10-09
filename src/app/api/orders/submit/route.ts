import { deliverLicenseEmail } from "@/lib/notifications";
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { db } from "@/lib/firebase";
import { buyWithWallet, planIds, validPlan } from "@/lib/order-service";
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
    if (!(await checkRateLimit(`submit:${user.uid}`, 10, 60)).allowed)
      throw new ApiError(429, "RATE_LIMIT_EXCEEDED");
    const { planId } = await jsonBody(req);
    if (!planIds.includes(planId)) throw new ApiError(400, "INVALID_PLAN");
    if (planId === "trial") {
      const id = `trial_${digest(user.uid)}`,
        result = await buyWithWallet(user.uid, "trial", id);
      await deliverLicenseEmail(digest(`wallet:${user.uid}:${id}`));
      return NextResponse.json(result);
    }
    const ref = db
      .collection("orders")
      .doc(digest(`pending:${user.uid}:${planId}`));
    const result = await db.runTransaction(
      async (tx) => {
        const [old, planSnap, userSnap] = await Promise.all([
          tx.get(ref),
          tx.get(db.collection("plans").doc(planId)),
          tx.get(db.collection("users").doc(user.uid)),
        ]);
        if (
          !activeUser(userSnap.data()) ||
          userSnap.data()?.email_verified !== true
        )
          throw new ApiError(403, "ACCOUNT_NOT_VERIFIED");
        if (old.exists && old.data()!.status === "PENDING_PAYMENT_REVIEW")
          return old.data()!;
        const plan = validPlan(planSnap.data()),
          data = {
            user_id: user.uid,
            plan_id: planId,
            plan_snapshot: plan,
            amount: plan.price,
            status: "PENDING_PAYMENT_REVIEW",
            transaction_code: `FH${ref.id.slice(0, 16).toUpperCase()}`,
            created_at: new Date(),
          };
        if (old.exists) throw new ApiError(409, "ORDER_ALREADY_PROCESSED");
        tx.set(ref, data);
        return data;
      },
      { maxAttempts: 20 },
    );
    return NextResponse.json({
      ok: true,
      orderId: ref.id,
      transactionCode: result.transaction_code,
      amount: result.amount,
    });
  } catch (error) {
    return failure(error);
  }
}
