import { NextRequest, NextResponse } from "next/server";
import { issueOTP } from "@/lib/account-service";
import { sendOTPEmail } from "@/lib/mailer";
import { emailAddress, jsonBody, ApiError, failure } from "@/lib/security";
import { checkRateLimit } from "@/lib/rate-limit";
export async function POST(req: NextRequest) {
  try {
    const { email } = await jsonBody(req),
      normalized = emailAddress(email);
    const ip =
      req.headers.get("x-vercel-forwarded-for") ||
      req.headers.get("x-forwarded-for")?.split(",")[0] ||
      "unknown";
    if (
      !(await checkRateLimit("otp-ip:" + ip, 5, 60)).allowed ||
      !(await checkRateLimit("otp-email:" + normalized, 5, 86400)).allowed
    )
      throw new ApiError(429, "RATE_LIMIT_EXCEEDED");
    try {
      const issued = await issueOTP(normalized, "VERIFY_EMAIL");
      await sendOTPEmail(normalized, issued.code);
    } catch (error) {
      if (!(
        error instanceof ApiError && error.code === "ACCOUNT_NOT_AVAILABLE"
      ))
        throw error;
    }
    return NextResponse.json({
      ok: true,
      message: "Nếu tài khoản phù hợp, mã xác thực đã được gửi.",
    });
  } catch (error) {
    return failure(error);
  }
}
