import { NextRequest, NextResponse } from "next/server";
import { findLicense, unbindLicenseInstallation } from "@/lib/license-service";
import { jsonBody, failure, ApiError } from "@/lib/security";
import { getAuthenticatedUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { licenseKey, installationId } = await jsonBody(req);
    if (typeof licenseKey !== "string" || !licenseKey.trim()) {
      throw new ApiError(400, "INVALID_LICENSE");
    }

    const ref = await findLicense(licenseKey.trim());
    let userId: string | null = null;
    try {
      const user = await getAuthenticatedUser(req);
      if (user) userId = user.uid;
    } catch (_) {
      // Unbind từ extension có thể không có user JWT cookie
    }

    const result = await unbindLicenseInstallation(
      ref,
      typeof installationId === "string" ? installationId : null,
      userId,
    );

    return NextResponse.json(
      { ok: true, ...result },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return failure(error, req);
  }
}
