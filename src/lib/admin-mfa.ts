import { createHmac, timingSafeEqual } from "node:crypto";
import { db } from "./firebase";
import { ApiError } from "./security";
function decode(secret: string) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const c of secret.replace(/=+$/, "").toUpperCase()) {
    const index = alphabet.indexOf(c);
    if (index < 0) throw new Error("MFA_CONFIG_INVALID");
    bits += index.toString(2).padStart(5, "0");
  }
  return Buffer.from(
    Array.from({ length: Math.floor(bits.length / 8) }, (_, i) =>
      parseInt(bits.slice(i * 8, i * 8 + 8), 2),
    ),
  );
}
export function totp(secret: string, step: number, digits = 6) {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(step));
  const hash = createHmac("sha1", decode(secret)).update(counter).digest();
  const offset = hash[hash.length - 1] & 15;
  return String(
    (hash.readUInt32BE(offset) & 0x7fffffff) % 10 ** digits,
  ).padStart(digits, "0");
}
export async function verifyAdminMFA(code: unknown) {
  const required =
    process.env.ADMIN_REQUIRE_MFA === "true" || !!process.env.ADMIN_TOTP_SECRET;
  if (!required) return;
  const secret = process.env.ADMIN_TOTP_SECRET;
  if (!secret || decode(secret).length < 20)
    throw new Error("MFA_CONFIG_MISSING");
  if (typeof code !== "string" || !/^\d{6}$/.test(code))
    throw new ApiError(401, "MFA_REQUIRED");
  const now = Math.floor(Date.now() / 30000);
  let matched: number | null = null;
  for (const step of [now - 1, now, now + 1])
    if (timingSafeEqual(Buffer.from(totp(secret, step)), Buffer.from(code)))
      matched = step;
  if (matched === null) throw new ApiError(401, "INVALID_MFA");
  const step = matched;
  await db.runTransaction(
    async (tx) => {
      const ref = db.collection("admin_mfa").doc("login"),
        snap = await tx.get(ref);
      if ((snap.data()?.last_step ?? -1) >= step)
        throw new ApiError(401, "MFA_ALREADY_USED");
      tx.set(ref, { last_step: step, updated_at: new Date() });
    },
    { maxAttempts: 20 },
  );
}
