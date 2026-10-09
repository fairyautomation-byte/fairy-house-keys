import { NextRequest, NextResponse } from "next/server";
import { completeOTP } from "@/lib/account-service";
import {
  emailAddress,
  jsonBody,
  failure,
  cookieOptions,
  ApiError,
} from "@/lib/security";
import { signUserToken, USER_COOKIE_NAME } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await jsonBody(req),
      normalized = emailAddress(email);
    if (!(await checkRateLimit(`otp-verify:${normalized}`, 10, 60)).allowed)
      throw new ApiError(429, "RATE_LIMIT_EXCEEDED");
    const result = await completeOTP(normalized, String(otp), "VERIFY_EMAIL");
    const token = await signUserToken(result.uid, normalized, result.version),
      res = NextResponse.json({ ok: true });
    res.cookies.set(USER_COOKIE_NAME, token, cookieOptions);
    return res;
  } catch (error) {
    return failure(error);
  }
}
