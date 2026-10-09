import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { hashPassword, validPassword } from "@/lib/password";
import {
  emailAddress,
  jsonBody,
  ApiError,
  digest,
  failure,
} from "@/lib/security";
import { checkRateLimit } from "@/lib/rate-limit";
import { issueOTP } from "@/lib/account-service";
import { sendOTPEmail } from "@/lib/mailer";
export async function POST(req: NextRequest) {
  try {
    const { fullName, email, password, zalo = "", _hp } = await jsonBody(req),
      normalized = emailAddress(email);
    if (
      _hp ||
      typeof fullName !== "string" ||
      !fullName.trim() ||
      fullName.length > 120 ||
      typeof zalo !== "string" ||
      zalo.length > 32 ||
      !validPassword(password)
    )
      throw new ApiError(
        400,
        "Thông tin không hợp lệ; mật khẩu cần 8–1024 ký tự.",
      );
    const ip =
      req.headers.get("x-vercel-forwarded-for") ||
      req.headers.get("x-forwarded-for")?.split(",")[0] ||
      "unknown";
    if (
      !(await checkRateLimit(`register:${ip}`, 3, 60)).allowed ||
      !(await checkRateLimit(`register-email:${normalized}`, 5, 86400)).allowed
    )
      throw new ApiError(429, "RATE_LIMIT_EXCEEDED");
    const hashed = await hashPassword(password),
      users = db.collection("users"),
      existing = await users.where("email", "==", normalized).limit(1).get();
    const reservation = db
        .collection("email_reservations")
        .doc(digest(normalized)),
      candidate = existing.empty ? users.doc() : existing.docs[0].ref;
    await db.runTransaction(
      async (tx) => {
        const reserved = await tx.get(reservation),
          userRef = reserved.exists
            ? users.doc(reserved.data()!.uid)
            : candidate;
        const snap = await tx.get(userRef),
          user = snap.data();
        if (
          snap.exists &&
          (user!.email_verified === true ||
            user!.status === "DELETED" ||
            (user!.wallet_balance || 0) > 0 ||
            user!.trial_used)
        )
          throw new ApiError(409, "EMAIL_ALREADY_EXISTS");
        tx.set(reservation, { uid: userRef.id, email: normalized });
        tx.set(userRef, {
          full_name: fullName.trim(),
          email: normalized,
          zalo: zalo.trim(),
          password: hashed,
          role: "USER",
          email_verified: false,
          auth_version: (user?.auth_version || 0) + 1,
          created_at: user?.created_at || new Date(),
          wallet_balance: user?.wallet_balance || 0,
          trial_used: user?.trial_used || false,
        });
      },
      { maxAttempts: 20 },
    );
    const issued = await issueOTP(normalized, "VERIFY_EMAIL");
    await sendOTPEmail(normalized, issued.code);
    return NextResponse.json({
      ok: true,
      fullEmail: normalized,
      message: "Mã xác thực đã được gửi",
    });
  } catch (error) {
    return failure(error);
  }
}
