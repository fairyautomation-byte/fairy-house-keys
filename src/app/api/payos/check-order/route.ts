import { deliverLicenseEmail } from "@/lib/notifications";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { getAuthenticatedUser } from "@/lib/auth";
import { payos } from "@/lib/payos";
import { settlePayment } from "@/lib/order-service";
import { ApiError, failure } from "@/lib/security";
import { checkRateLimit } from "@/lib/rate-limit";
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) throw new ApiError(401, "Unauthorized");
    const raw = req.nextUrl.searchParams.get("orderCode");
    if (!raw || !/^\d{1,15}$/.test(raw))
      throw new ApiError(400, "INVALID_ORDER_CODE");
    const code = Number(raw);
    const query = await db
      .collection("payos_orders")
      .where("payosOrderCode", "==", code)
      .limit(2)
      .get();
    if (query.size !== 1) throw new ApiError(404, "ORDER_NOT_FOUND");
    const ref = query.docs[0].ref;
    let data = query.docs[0].data();
    if (data.userId !== user.uid) throw new ApiError(403, "Unauthorized");
    if (
      data.status !== "PAID" &&
      (await checkRateLimit(`payment-reconcile:${code}`, 1, 10)).allowed
    ) {
      const info = await payos.getPaymentLinkInformation(code);
      if (info.status === "PAID" && info.amountPaid === data.amount) {
        await settlePayment(code, data.amount, `reconcile:${code}`);
        data = (await ref.get()).data()!;
      } else if (info.status === "CANCELLED")
        await ref.update({ status: "CANCELED" });
    }
    if (data.status === "PAID") await deliverLicenseEmail(`payos_${code}`);
    return NextResponse.json(
      {
        status: data.status,
        amount: data.amount,
        licenseKey: data.license_key || null,
        fulfillment: data.fulfillment || null,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return failure(error);
  }
}
