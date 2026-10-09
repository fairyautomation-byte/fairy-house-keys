import * as crypto from "crypto";

/**
 * Generate a secure 6-digit OTP
 */
export function generateOTP(): string {
  // Use crypto.randomInt for cryptographically secure pseudo-random number generator (CSPRNG)
  // Generates a number between 100000 and 999999
  const otp = crypto.randomInt(100000, 1000000);
  return String(otp).padStart(6, "0");
}

/**
 * Hash the OTP using HMAC-SHA256
 */
export function hashOTP(otp: string): string {
  const secret = process.env.OTP_SECRET_KEY;
  if (!secret) {
    throw new Error("OTP_SECRET_KEY environment variable is missing");
  }
  return crypto.createHmac("sha256", secret).update(otp).digest("hex");
}

/**
 * Verify an OTP input against a stored hash using timingSafeEqual
 * to prevent timing attacks.
 */
export function verifyOTP(inputOtp: string, storedHash: string): boolean {
  const inputHash = hashOTP(inputOtp);
  const a = Buffer.from(inputHash, "hex");
  const b = Buffer.from(storedHash, "hex");

  if (a.length !== b.length) {
    return false;
  }
  return crypto.timingSafeEqual(a, b);
}
