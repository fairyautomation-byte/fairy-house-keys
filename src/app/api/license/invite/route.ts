import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import {
  findLicense,
  licenseView,
  vietnamDay,
  validateLicense,
} from "@/lib/license-service";
import {
  jsonBody,
  failure,
  ApiError,
  digest,
  activeUser,
} from "@/lib/security";
export async function POST(req: NextRequest) {
  try {
    const {
      licenseKey,
      requestId,
      action = "consume",
      installationId,
    } = await jsonBody(req);
    if (
      typeof licenseKey !== "string" ||
      !/^[a-zA-Z0-9_-]{8,80}$/.test(licenseKey.trim())
    ) {
      throw new ApiError(400, "INVALID_LICENSE_KEY");
    }
    if (
      typeof requestId !== "string" ||
      !/^[a-zA-Z0-9_-]{16,128}$/.test(requestId)
    )
      throw new ApiError(400, "REQUEST_ID_REQUIRED");
    if (!["check", "consume"].includes(action))
      throw new ApiError(400, "INVALID_ACTION");
    const ref = await findLicense(licenseKey.trim());
    await validateLicense(ref, installationId);
    const result = await db.runTransaction(
      async (tx) => {
        const license = await tx.get(ref),
          data = license.data();
        if (!data || !licenseView(data).valid)
          throw new ApiError(403, "LICENSE_DENIED");
        if (data.installation_id !== installationId?.trim())
          throw new ApiError(403, "DEVICE_LIMIT_EXCEEDED");
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
        const used = usage.data()?.used || 0;
        const response = { allowed: true, blocked: false, unlimited: true, remaining: null };
        if (action === "check")
          return response;
        // Preserve deduplication, including receipts created under the old limit.
        if (old.exists) return response;
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
    return failure(error, req);
  }
}
