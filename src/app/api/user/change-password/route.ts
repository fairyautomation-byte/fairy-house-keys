import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { getAuthenticatedUser, USER_COOKIE_NAME } from "@/lib/auth";
import { hashPassword, verifyPassword, validPassword } from "@/lib/password";
import { jsonBody, ApiError, failure } from "@/lib/security";
import { checkRateLimit } from "@/lib/rate-limit";
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) throw new ApiError(401, "Unauthorized");
    const { oldPassword, newPassword } = await jsonBody(req);
    if (typeof oldPassword !== "string" || !validPassword(newPassword))
      throw new ApiError(400, "INVALID_PASSWORD");
    if (!(await checkRateLimit(`change-password:${user.uid}`, 5, 60)).allowed)
      throw new ApiError(429, "RATE_LIMIT_EXCEEDED");
    const ref = db.collection("users").doc(user.uid),
      snap = await ref.get(),
      data = snap.data()!;
    if (!(await verifyPassword(oldPassword, data.password)))
      throw new ApiError(400, "Mật khẩu cũ không đúng");
    const hashed = await hashPassword(newPassword);
    await db.runTransaction(
      async (tx) => {
        const fresh = await tx.get(ref);
        if (fresh.data()?.password !== data.password)
          throw new ApiError(409, "ACCOUNT_CHANGED");
        tx.update(ref, {
          password: hashed,
          auth_version: (fresh.data()!.auth_version || 0) + 1,
        });
      },
      { maxAttempts: 20 },
    );
    const res = NextResponse.json({
      ok: true,
      message: "Đã đổi mật khẩu. Vui lòng đăng nhập lại.",
    });
    res.cookies.delete(USER_COOKIE_NAME);
    return res;
  } catch (error) {
    return failure(error);
  }
}
