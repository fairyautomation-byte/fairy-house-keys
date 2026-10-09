import { db } from "./firebase";
import { sendKeyToCustomer } from "./mailer";
import { randomUUID } from "node:crypto";
export async function deliverLicenseEmail(id: string) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) return;
  const ref = db.collection("email_outbox").doc(id),
    lease = randomUUID();
  const job = await db.runTransaction(
    async (tx) => {
      const snap = await tx.get(ref),
        data = snap.data();
      if (
        !data ||
        data.status === "SENT" ||
        data.lease_until?.toMillis() > Date.now()
      )
        return null;
      tx.update(ref, {
        lease,
        lease_until: new Date(Date.now() + 60000),
        status: "SENDING",
      });
      return data;
    },
    { maxAttempts: 20 },
  );
  if (!job) return;
  try {
    const user = await db.collection("users").doc(job.user_id).get(),
      license = await db.collection("licenses").doc(job.license_id).get();
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
    await ref.update({
      status: "SENT",
      sent_at: new Date(),
      lease_until: null,
    });
  } catch {
    await db.runTransaction(async (tx) => {
      const current = await tx.get(ref);
      if (current.data()?.lease === lease)
        tx.update(ref, {
          status: "PENDING",
          lease_until: null,
          last_error: "EMAIL_DELIVERY_FAILED",
        });
    });
    console.error("License notification queued for retry");
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
    created_at: new Date(),
  });
}
