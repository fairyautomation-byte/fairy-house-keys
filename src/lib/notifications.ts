import { db } from "./firebase";
import { sendKeyToCustomer } from "./mailer";
import { randomUUID } from "node:crypto";

function toMillis(val: any): number {
  if (!val) return 0;
  if (typeof val.toMillis === "function") return val.toMillis();
  if (typeof val.getTime === "function") return val.getTime();
  if (typeof val === "number") return val;
  return new Date(val).getTime() || 0;
}

export async function deliverLicenseEmail(id: string) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) return;
  const ref = db.collection("email_outbox").doc(id);
  const lease = randomUUID();
  const now = Date.now();

  const job = await db.runTransaction(
    async (tx) => {
      const snap = await tx.get(ref);
      const data = snap.data();
      if (!data) return null;
      if (data.status === "SENT" || data.status === "DEAD_LETTER") return null;

      // Check if not yet eligible for next attempt (anti-starvation backoff)
      if (data.next_attempt_at && toMillis(data.next_attempt_at) > now) {
        return null;
      }

      // Check if existing lease is still active
      if (data.lease_until && toMillis(data.lease_until) > now) {
        return null;
      }

      const attempts = (data.attempts || 0) + 1;
      const maxAttempts = data.max_attempts || 5;
      if (attempts > maxAttempts) {
        tx.update(ref, {
          status: "DEAD_LETTER",
          dead_letter_at: new Date(),
          last_error: "MAX_ATTEMPTS_EXCEEDED",
        });
        return null;
      }

      tx.update(ref, {
        lease,
        lease_until: new Date(now + 60000),
        status: "SENDING",
        attempts,
      });
      return {
        user_id: data.user_id as string,
        license_id: data.license_id as string,
        attempts,
        maxAttempts,
      };
    },
    { maxAttempts: 20 },
  );

  if (!job) return;

  try {
    const user = await db.collection("users").doc(job.user_id).get();
    const license = await db.collection("licenses").doc(job.license_id).get();
    if (!user.exists || !license.exists || user.data()!.status === "DELETED")
      throw new Error("EMAIL_RECIPIENT_UNAVAILABLE");

    const data = license.data()!;
    await sendKeyToCustomer({
      fullName: user.data()!.full_name || "Khách hàng",
      email: user.data()!.email,
      key: data.license_key,
      packageType: data.plan_id,
      expiresAt: data.expires_at?.toDate() || null,
    });

    // Mark SENT only if our lease fencing token is still valid
    await db.runTransaction(async (tx) => {
      const current = await tx.get(ref);
      if (current.data()?.lease === lease) {
        tx.update(ref, {
          status: "SENT",
          sent_at: new Date(),
          lease_until: null,
        });
      }
    });
  } catch (err: any) {
    const backoffSec = Math.min(3600, Math.pow(2, job.attempts) * 15);
    const nextAttemptAt = new Date(Date.now() + backoffSec * 1000);

    await db.runTransaction(async (tx) => {
      const current = await tx.get(ref);
      if (current.data()?.lease === lease) {
        if (job.attempts >= job.maxAttempts) {
          tx.update(ref, {
            status: "DEAD_LETTER",
            dead_letter_at: new Date(),
            last_error: err?.message || "EMAIL_DELIVERY_FAILED",
            lease_until: null,
          });
        } else {
          tx.update(ref, {
            status: "PENDING",
            next_attempt_at: nextAttemptAt,
            lease_until: null,
            last_error: err?.message || "EMAIL_DELIVERY_FAILED",
          });
        }
      }
    });
    console.error(
      `License notification #${id} failed (attempt ${job.attempts}/${job.maxAttempts}), retry scheduled`,
    );
  }
}

export function queueLicenseEmail(
  tx: FirebaseFirestore.Transaction,
  id: string,
  userId: string,
  licenseId: string,
) {
  tx.set(db.collection("email_outbox").doc(id), {
    user_id: userId,
    license_id: licenseId,
    status: "PENDING",
    attempts: 0,
    max_attempts: 5,
    next_attempt_at: new Date(),
    created_at: new Date(),
  });
}
