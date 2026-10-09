import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { findLicense, licenseView, vietnamDay } from "@/lib/license-service";
import {
  jsonBody,
  failure,
  ApiError,
  digest,
  activeUser,
} from "@/lib/security";
export async function POST(req: NextRequest) {
  try {
    const { licenseKey, requestId, action = "consume" } = await jsonBody(req);
    if (
      typeof requestId !== "string" ||
      !/^[a-zA-Z0-9_-]{16,128}$/.test(requestId)
    )
      throw new ApiError(400, "REQUEST_ID_REQUIRED");
    const ref = await findLicense(licenseKey);
    const result = await db.runTransaction(
      async (tx) => {
        const license = await tx.get(ref),
          data = license.data();
        if (!data || !licenseView(data).valid)
          throw new ApiError(403, "LICENSE_DENIED");
        const owner = await tx.get(db.collection("users").doc(data.user_id));
        if (!owner.exists || !activeUser(owner.data()))
          throw new ApiError(403, "LICENSE_DENIED");
        const day = vietnamDay(),
          counter = db
            .collection("invite_usage")
            .doc(digest(`${data.user_id}:${day}`)),
          receipt = db
            .collection("invite_requests")
            .doc(digest(`${data.user_id}:${requestId}`));
        const [usage, old] = await Promise.all([
          tx.get(counter),
          tx.get(receipt),
        ]);
        if (old.exists) return old.data()!.response;
        const used = usage.data()?.used || 0;
        if (!["check", "consume"].includes(action))
          throw new ApiError(400, "INVALID_ACTION");
        if (action === "check")
          return {
            allowed: used < 100,
            blocked: used >= 100,
            remaining: Math.max(0, 100 - used),
          };
        if (used >= 100) throw new ApiError(429, "INVITE_LIMIT_REACHED");
        const response = { allowed: true, remaining: 99 - used };
        tx.set(counter, {
          used: used + 1,
          day,
          expires_at: new Date(Date.now() + 7 * 86400000),
        });
        tx.set(receipt, {
          response,
          expires_at: new Date(Date.now() + 7 * 86400000),
        });
        return response;
      },
      { maxAttempts: 20 },
    );
    return NextResponse.json({ ok: true, data: result });
  } catch (error) {
    return failure(error);
  }
}
