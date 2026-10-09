import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { isAdminAuthenticated } from "@/lib/auth";
import { ApiError, failure } from "@/lib/security";
import { payos } from "@/lib/payos";
import { settlePayment } from "@/lib/order-service";
import { deliverLicenseEmail } from "@/lib/notifications";
export async function POST(req: NextRequest) {
  try {
    if (!(await isAdminAuthenticated(req)))
      throw new ApiError(401, "Unauthorized");
    const query = await db
      .collection("payos_orders")
      .where("status", "in", [
        "PENDING",
        "CREATING",
        "CANCELED",
        "EXPIRED",
        "CREATE_FAILED",
      ])
      .limit(50)
      .get();
    let settled = 0,
      failed = 0;
    for (const doc of query.docs) {
      try {
        const data = doc.data(),
          info = await payos.getPaymentLinkInformation(data.payosOrderCode);
        if (info.status === "PAID" && info.amountPaid === data.amount) {
          await settlePayment(
            data.payosOrderCode,
            data.amount,
            `reconcile:${data.payosOrderCode}`,
          );
          settled++;
        }
      } catch {
        failed++;
      }
    }
    const emails = await db
      .collection("email_outbox")
      .where("status", "in", ["PENDING", "SENDING"])
      .limit(20)
      .get();
    for (const doc of emails.docs) await deliverLicenseEmail(doc.id);
    await db.collection("admin_audit").add({
      action: "RECONCILE_PAYMENTS",
      settled,
      failed,
      created_at: new Date(),
    });
    return NextResponse.json({ ok: true, settled, failed });
  } catch (error) {
    return failure(error);
  }
}
