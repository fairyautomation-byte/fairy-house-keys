import { db } from "./firebase";
import { generateOTP, hashOTP, verifyOTP } from "./otp";
import { ApiError, digest, activeUser } from "./security";
import { hashPassword } from "./password";
import { randomUUID } from "node:crypto";
export type Purpose = "VERIFY_EMAIL" | "RESET_PASSWORD";
export const otpRef = (email: string, purpose: Purpose) =>
  db.collection("email_otp_sessions").doc(digest(`${purpose}:${email}`));
export async function issueOTP(email: string, purpose: Purpose) {
  const code = generateOTP(),
    generation = randomUUID(),
    now = new Date();
  const query = await db
    .collection("users")
    .where("email", "==", email)
    .limit(1)
    .get();
  if (query.empty) throw new ApiError(400, "ACCOUNT_NOT_AVAILABLE");
  const userRef = query.docs[0].ref,
    ref = otpRef(email, purpose);
  await db.runTransaction(
    async (tx) => {
      const [user, old] = await Promise.all([tx.get(userRef), tx.get(ref)]);
      const data = user.data();
      if (
        !activeUser(data) ||
        (purpose === "RESET_PASSWORD"
          ? data!.email_verified !== true
          : data!.email_verified === true)
      )
        throw new ApiError(400, "ACCOUNT_NOT_AVAILABLE");
      if (
        old.exists &&
        old.data()!.last_sent_at.toMillis() > now.getTime() - 60000
      )
        throw new ApiError(429, "OTP_COOLDOWN");
      tx.set(ref, {
        uid: user.id,
        email,
        purpose,
        generation,
        otp_hash: hashOTP(code),
        expires_at: new Date(now.getTime() + 300000),
        attempts: 0,
        max_attempts: 5,
        used: false,
        invalidated: false,
        created_at: now,
        last_sent_at: now,
      });
    },
    { maxAttempts: 20 },
  );
  return { code, generation, ref };
}
export async function completeOTP(
  email: string,
  code: string,
  purpose: Purpose,
  newPassword?: string,
) {
  if (!/^\d{6}$/.test(code)) throw new ApiError(400, "INVALID_OTP");
  const password = newPassword ? await hashPassword(newPassword) : undefined;
  const result = await db.runTransaction(
    async (tx) => {
      const ref = otpRef(email, purpose),
        snap = await tx.get(ref),
        session = snap.data();
      if (
        !session ||
        session.purpose !== purpose ||
        session.email !== email ||
        session.used ||
        session.invalidated ||
        session.expires_at.toMillis() <= Date.now()
      )
        return { error: "OTP_EXPIRED" };
      if (session.attempts >= 5) return { error: "OTP_LOCKED" };
      const userRef = db.collection("users").doc(session.uid),
        userSnap = await tx.get(userRef),
        user = userSnap.data();
      if (
        !activeUser(user) ||
        user!.email !== email ||
        (purpose === "RESET_PASSWORD"
          ? user!.email_verified !== true
          : user!.email_verified === true)
      )
        return { error: "ACCOUNT_NOT_AVAILABLE" };
      if (!verifyOTP(code, session.otp_hash)) {
        tx.update(ref, {
          attempts: session.attempts + 1,
          invalidated: session.attempts + 1 >= 5,
        });
        return { error: "INVALID_OTP" };
      }
      tx.update(ref, { used: true, used_at: new Date() });
      const version = (user!.auth_version || 0) + 1;
      tx.update(
        userRef,
        purpose === "RESET_PASSWORD"
          ? { password, auth_version: version }
          : {
              email_verified: true,
              email_verified_at: new Date(),
              auth_version: version,
            },
      );
      return { uid: session.uid as string, version };
    },
    { maxAttempts: 20 },
  );
  if (result.error)
    throw new ApiError(result.error === "OTP_LOCKED" ? 429 : 400, result.error);
  return result as { uid: string; version: number };
}
