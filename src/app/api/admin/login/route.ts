import { NextRequest, NextResponse } from "next/server";
import {
  validateAdminCredentials,
  signAdminToken,
  ADMIN_COOKIE_NAME,
} from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { verifyAdminMFA } from "@/lib/admin-mfa";
import {
  jsonBody,
  ApiError,
  failure,
  cookieOptions,
  sameOrigin,
} from "@/lib/security";
export async function POST(req: NextRequest) {
  try {
    if (!sameOrigin(req)) throw new ApiError(403, "ORIGIN_DENIED");
    const ip =
      req.headers.get("x-vercel-forwarded-for") ||
      req.headers.get("x-forwarded-for")?.split(",")[0] ||
      "unknown";
    if (
      !(await checkRateLimit(`admin-login:${ip}`, 5, 300)).allowed ||
      !(await checkRateLimit("admin-login-global", 25, 300)).allowed
    )
      throw new ApiError(429, "RATE_LIMIT_EXCEEDED");
    const { username, password, otp } = await jsonBody(req);
    if (!validateAdminCredentials(username, password))
      throw new ApiError(401, "Sai tên đăng nhập hoặc mật khẩu");
    await verifyAdminMFA(otp);
    const res = NextResponse.json({ ok: true });
    res.cookies.set(ADMIN_COOKIE_NAME, await signAdminToken(), {
      ...cookieOptions,
      maxAge: 3600,
    });
    return res;
  } catch (error) {
    return failure(error);
  }
}
export async function DELETE(req: NextRequest) {
  if (!sameOrigin(req))
    return NextResponse.json({ error: "ORIGIN_DENIED" }, { status: 403 });
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(ADMIN_COOKIE_NAME);
  return res;
}
