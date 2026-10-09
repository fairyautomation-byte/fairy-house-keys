import { db } from "@/lib/firebase";
import { deliverLicenseEmail } from "@/lib/notifications";
import { digest } from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";
import { payos } from "@/lib/payos";
import { settlePayment } from "@/lib/order-service";
import { jsonBody, failure, ApiError } from "@/lib/security";
export async function GET() {
  return NextResponse.json({ success: true });
}
export async function POST(req: NextRequest) {
  try {
    const body = await jsonBody(req);
    let data;
    try {
      data = payos.verifyPaymentWebhookData(body);
    } catch {
      throw new ApiError(400, "INVALID_SIGNATURE");
    }
    if (data.code !== "00")
      return NextResponse.json({ success: true, ignored: true });
    if (
      !Number.isSafeInteger(data.orderCode) ||
      !Number.isSafeInteger(data.amount) ||
      data.amount <= 0
    )
      throw new ApiError(400, "INVALID_PAYMENT");
    const event = db
      .collection("payment_events")
      .doc(digest(`${data.orderCode}:${data.reference}:${data.amount}`));
    await event.set(
      {
        order_code: data.orderCode,
        amount: data.amount,
        reference: data.reference || "",
        status: "RECEIVED",
        created_at: new Date(),
      },
      { merge: true },
    );
    await settlePayment(data.orderCode, data.amount, data.reference || "");
    await event.update({ status: "PROCESSED" });
    await deliverLicenseEmail(`payos_${data.orderCode}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    return failure(error);
  }
}
