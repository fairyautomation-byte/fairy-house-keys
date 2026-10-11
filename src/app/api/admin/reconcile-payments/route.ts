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
    const MAX_DUE_ORDERS = 50;
    const TIME_BUDGET_MS = 25000;
    const scanStart = Date.now();

    // Starvation-free: cursor-based scan through payos_orders backlog until due orders are collected or exhausted
    const dueOrders: Array<{ doc: any; data: any; nextAt: number }> = [];
    let lastOrderDoc: any = null;

    while (dueOrders.length < MAX_DUE_ORDERS && Date.now() - scanStart < TIME_BUDGET_MS) {
      let q: any = db
        .collection("payos_orders")
        .where("status", "in", [
          "PENDING",
          "CREATING",
          "CANCELED",
          "EXPIRED",
          "CREATE_FAILED",
        ]);

      if (lastOrderDoc && typeof q.startAfter === "function") {
        q = q.startAfter(lastOrderDoc);
      } else if (lastOrderDoc) {
        break;
      }

      if (typeof q.startAfter !== "function") {
        const snap = await q.get();
        for (const doc of snap.docs) {
          const data = doc.data();
          const nextAt = toMillis(data.next_reconcile_at);
          if (!nextAt || nextAt <= now) {
            dueOrders.push({ doc, data, nextAt });
            if (dueOrders.length >= MAX_DUE_ORDERS) break;
          }
        }
        break;
      }

      const snap = await q.limit(200).get();
      if (!snap || snap.empty || snap.docs.length === 0) break;

      for (const doc of snap.docs) {
        const data = doc.data();
        const nextAt = toMillis(data.next_reconcile_at);
        if (!nextAt || nextAt <= now) {
          dueOrders.push({ doc, data, nextAt });
          if (dueOrders.length >= MAX_DUE_ORDERS) break;
        }
      }

      if (snap.docs.length < 200) break;
      lastOrderDoc = snap.docs[snap.docs.length - 1];
    }

    dueOrders.sort((a, b) => (a.nextAt || 0) - (b.nextAt || 0));

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

    // Starvation-free: cursor-based scan through email_outbox backlog
    const dueEmails: Array<{ doc: any; data: any; nextAt: number }> = [];
    const MAX_DUE_EMAILS = 20;
    let lastEmailDoc: any = null;

    while (dueEmails.length < MAX_DUE_EMAILS && Date.now() - scanStart < TIME_BUDGET_MS) {
      let eq: any = db
        .collection("email_outbox")
        .where("status", "in", ["PENDING", "SENDING"]);

      if (lastEmailDoc && typeof eq.startAfter === "function") {
        eq = eq.startAfter(lastEmailDoc);
      } else if (lastEmailDoc) {
        break;
      }

      if (typeof eq.startAfter !== "function") {
        const snap = await eq.get();
        for (const doc of snap.docs) {
          const data = doc.data();
          const nextAt = toMillis(data.next_attempt_at);
          if (data.status !== "DEAD_LETTER" && (!nextAt || nextAt <= now)) {
            dueEmails.push({ doc, data, nextAt });
            if (dueEmails.length >= MAX_DUE_EMAILS) break;
          }
        }
        break;
      }

      const snap = await eq.limit(100).get();
      if (!snap || snap.empty || snap.docs.length === 0) break;

      for (const doc of snap.docs) {
        const data = doc.data();
        const nextAt = toMillis(data.next_attempt_at);
        if (data.status !== "DEAD_LETTER" && (!nextAt || nextAt <= now)) {
          dueEmails.push({ doc, data, nextAt });
          if (dueEmails.length >= MAX_DUE_EMAILS) break;
        }
      }

      if (snap.docs.length < 100) break;
      lastEmailDoc = snap.docs[snap.docs.length - 1];
    }

    dueEmails.sort((a, b) => (a.nextAt || 0) - (b.nextAt || 0));

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
