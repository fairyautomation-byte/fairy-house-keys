import { NextRequest, NextResponse } from "next/server";
import { completeOTP } from "@/lib/account-service";
import { validPassword } from "@/lib/password";
import { emailAddress, jsonBody, ApiError, failure } from "@/lib/security";
import { checkRateLimit } from "@/lib/rate-limit";
export async function POST(req: NextRequest) {
  try {
    const { email, otp, newPassword } = await jsonBody(req),
      normalized = emailAddress(email);
    if (!validPassword(newPassword))
      throw new ApiError(400, "Mật khẩu phải có 8–1024 ký tự");
    if (!(await checkRateLimit(`otp-reset:${normalized}`, 10, 60)).allowed)
      throw new ApiError(429, "RATE_LIMIT_EXCEEDED");
    await completeOTP(normalized, String(otp), "RESET_PASSWORD", newPassword);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return failure(error);
  }
}
