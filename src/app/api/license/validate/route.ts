import { NextRequest, NextResponse } from "next/server";
import { findLicense, validateLicense } from "@/lib/license-service";
import { jsonBody, failure, ApiError } from "@/lib/security";
import { checkRateLimit } from "@/lib/rate-limit";
export async function POST(req: NextRequest) {
  try {
    const { licenseKey } = await jsonBody(req);
    if (
      typeof licenseKey !== "string" ||
      !/^[a-zA-Z0-9_-]{8,80}$/.test(licenseKey.trim())
    ) {
      throw new ApiError(400, "INVALID_LICENSE_FORMAT");
    }

    const cleanKey = licenseKey.trim();
    const rateLimit = await checkRateLimit(
      `validate:${cleanKey.slice(0, 80)}`,
      180,
      60,
    );
    if (!rateLimit.allowed) {
      throw new ApiError(
        429,
        "RATE_LIMIT_EXCEEDED",
        undefined,
        rateLimit.retryAfterSeconds,
        true,
      );
    }

    return NextResponse.json(
      await validateLicense(await findLicense(cleanKey)),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const res = failure(error, req);
    const data = await res.json();
    return NextResponse.json(
      { ...data, valid: false },
      { status: res.status, headers: res.headers },
    );
  }
}
