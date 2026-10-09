import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { signUserToken, USER_COOKIE_NAME } from "@/lib/auth";
import { verifyPassword, hashPassword } from "@/lib/password";
import {
  emailAddress,
  jsonBody,
  ApiError,
  failure,
  activeUser,
  cookieOptions,
} from "@/lib/security";
import { checkRateLimit } from "@/lib/rate-limit";
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await jsonBody(req),
      normalized = emailAddress(email);
    if (typeof password !== "string" || !password || password.length > 1024)
      throw new ApiError(400, "INVALID_PASSWORD");
    const ip =
      req.headers.get("x-vercel-forwarded-for") ||
      req.headers.get("x-forwarded-for")?.split(",")[0] ||
      "unknown";
    if (
      !(await checkRateLimit(`login:${ip}`, 10, 60)).allowed ||
      !(await checkRateLimit(`login-email:${normalized}`, 10, 300)).allowed
    )
      throw new ApiError(429, "RATE_LIMIT_EXCEEDED");
    const query = await db
        .collection("users")
        .where("email", "==", normalized)
        .limit(1)
        .get(),
      snap = query.docs[0],
      user = snap?.data();
    if (
      !user ||
      !activeUser(user) ||
      !(await verifyPassword(password, user.password))
    )
      throw new ApiError(401, "Email hoặc mật khẩu không chính xác");
    if (user.email_verified !== true)
      return NextResponse.json(
        {
          error: "Tài khoản cần xác thực email.",
          code: "EMAIL_NOT_VERIFIED",
          email: normalized,
        },
        { status: 403 },
      );
    if (!user.password.startsWith("scrypt$")) {
      const upgraded = await hashPassword(password);
      await db.runTransaction(
        async (tx) => {
          const fresh = await tx.get(snap.ref);
          if (
            fresh.data()?.password !== user.password ||
            (fresh.data()?.auth_version || 0) !== (user.auth_version || 0)
          )
            throw new ApiError(401, "SESSION_CHANGED");
          tx.update(snap.ref, { password: upgraded });
        },
        { maxAttempts: 20 },
      );
    }
    const token = await signUserToken(
        snap.id,
        normalized,
        user.auth_version || 0,
      ),
      res = NextResponse.json({ ok: true, uid: snap.id });
    res.cookies.set(USER_COOKIE_NAME, token, cookieOptions);
    return res;
  } catch (error) {
    return failure(error);
  }
}
export async function DELETE(req: NextRequest) {
  const { POST } = await import("../logout/route");
  return POST(req);
}
