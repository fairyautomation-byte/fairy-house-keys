import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { isAdminAuthenticated } from "@/lib/auth";
import { ApiError, failure } from "@/lib/security";
import { payos } from "@/lib/payos";
import { settlePayment } from "@/lib/order-service";
import { deliverLicenseEmail } from "@/lib/notifications";

function toMillis(val: any): number {
  if (!val) return 0;
  if (typeof val.toMillis === "function") return val.toMillis();
  if (typeof val.getTime === "function") return val.getTime();
  if (typeof val === "number") return val;
  return new Date(val).getTime() || 0;
}

export async function POST(req: NextRequest) {
  try {
    if (!(await isAdminAuthenticated(req)))
      throw new ApiError(401, "Unauthorized");

    const now = Date.now();
    // Anti-starvation: query broader window of candidates and prioritize due orders
    const orderCandidates = await db
      .collection("payos_orders")
      .where("status", "in", [
        "PENDING",
        "CREATING",
        "CANCELED",
        "EXPIRED",
        "CREATE_FAILED",
      ])
      .limit(200)
      .get();

    const dueOrders = orderCandidates.docs
      .map((doc: any) => ({
        doc,
        data: doc.data(),
        nextAt: toMillis(doc.data().next_reconcile_at),
      }))
      .filter((item: any) => !item.nextAt || item.nextAt <= now)
      .sort((a: any, b: any) => (a.nextAt || 0) - (b.nextAt || 0))
      .slice(0, 50);

    let settled = 0,
      failed = 0;

    for (const item of dueOrders) {
      const doc = item.doc;
      const data = item.data;

      try {
        const info = await payos.getPaymentLinkInformation(data.payosOrderCode);
        if (info.status === "PAID" && info.amountPaid === data.amount) {
          await settlePayment(
            data.payosOrderCode,
            data.amount,
            `reconcile:${data.payosOrderCode}`,
          );
          settled++;
        } else {
          // Update attempt and backoff so it doesn't starve other orders
          const attempts = (data.reconcile_attempts || 0) + 1;
          await doc.ref.update({
            reconcile_attempts: attempts,
            last_reconcile_at: new Date(),
            next_reconcile_at: new Date(now + Math.min(3600000, attempts * 60000)),
          });
        }
      } catch {
        const attempts = (data.reconcile_attempts || 0) + 1;
        await doc.ref.update({
          reconcile_attempts: attempts,
          last_reconcile_at: new Date(),
          next_reconcile_at: new Date(now + Math.min(3600000, attempts * 60000)),
        });
        failed++;
      }
    }

    // Anti-starvation: query broader window for emails, filter out dead-letters and future backoffs
    const emailCandidates = await db
      .collection("email_outbox")
      .where("status", "in", ["PENDING", "SENDING"])
      .limit(100)
      .get();

    const dueEmails = emailCandidates.docs
      .map((doc: any) => ({
        doc,
        data: doc.data(),
        nextAt: toMillis(doc.data().next_attempt_at),
      }))
      .filter(
        (item: any) =>
          item.data.status !== "DEAD_LETTER" &&
          (!item.nextAt || item.nextAt <= now),
      )
      .sort((a: any, b: any) => (a.nextAt || 0) - (b.nextAt || 0))
      .slice(0, 20);

    for (const item of dueEmails) {
      await deliverLicenseEmail(item.doc.id);
    }

    await db.collection("admin_audit").add({
      action: "RECONCILE_PAYMENTS",
      settled,
      failed,
      created_at: new Date(),
    });

    return NextResponse.json({ ok: true, settled, failed });
  } catch (error) {
    return failure(error, req);
  }
}
