import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { verifyToken } from "@/lib/jwt";
import { USER_COOKIE_NAME, ADMIN_COOKIE_NAME } from "@/lib/auth";
import { sameOrigin, failure, ApiError } from "@/lib/security";
export async function POST(req: NextRequest) {
  try {
    if (!sameOrigin(req)) throw new ApiError(403, "ORIGIN_DENIED");
    const payload = await verifyToken(
      req.cookies.get(USER_COOKIE_NAME)?.value || "",
    );
    if (payload?.role === "user" && payload.sid)
      await db
        .collection("revoked_sessions")
        .doc(payload.sid)
        .set({ expires_at: new Date(payload.exp * 1000) });
    const res = NextResponse.json({ success: true });
    res.cookies.delete(USER_COOKIE_NAME);
    res.cookies.delete(ADMIN_COOKIE_NAME);
    return res;
  } catch (error) {
    return failure(error);
  }
}
