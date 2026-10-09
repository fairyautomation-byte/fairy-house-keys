import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { db } from "@/lib/firebase";
import { payos } from "@/lib/payos";
import { jsonBody, failure, ApiError } from "@/lib/security";
import { settlePayment } from "@/lib/order-service";
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) throw new ApiError(401, "Unauthorized");
    const { orderCode } = await jsonBody(req);
    if (!Number.isSafeInteger(orderCode))
      throw new ApiError(400, "INVALID_ORDER_CODE");
    const query = await db
      .collection("payos_orders")
      .where("payosOrderCode", "==", orderCode)
      .limit(2)
      .get();
    if (query.size !== 1) throw new ApiError(404, "ORDER_NOT_FOUND");
    const ref = query.docs[0].ref,
      data = query.docs[0].data();
    if (data.userId !== user.uid) throw new ApiError(403, "Unauthorized");
    if (data.status === "PAID")
      return NextResponse.json({ ok: true, status: "PAID" });
    const result = await payos.cancelPaymentLink(
      orderCode,
      "Khách hàng hủy thanh toán",
    );
    if (result.status === "PAID") {
      await settlePayment(
        orderCode,
        result.amountPaid,
        `cancel-reconcile:${orderCode}`,
      );
      return NextResponse.json({ ok: true, status: "PAID" });
    }
    await db.runTransaction(
      async (tx) => {
        const fresh = await tx.get(ref);
        if (fresh.data()?.status !== "PAID")
          tx.update(ref, { status: "CANCELED", canceled_at: new Date() });
      },
      { maxAttempts: 20 },
    );
    return NextResponse.json({ ok: true, status: "CANCELED" });
  } catch (error) {
    return failure(error);
  }
}
