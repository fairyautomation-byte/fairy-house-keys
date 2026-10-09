import { NextRequest, NextResponse } from "next/server";
import { findLicense, validateLicense } from "@/lib/license-service";
import { jsonBody, failure, ApiError } from "@/lib/security";
import { checkRateLimit } from "@/lib/rate-limit";
export async function POST(req: NextRequest) {
  try {
    const { licenseKey } = await jsonBody(req);
    if (
      !(
        await checkRateLimit(
          `validate:${String(licenseKey).slice(0, 80)}`,
          180,
          60,
        )
      ).allowed
    )
      throw new ApiError(429, "RATE_LIMIT_EXCEEDED");
    return NextResponse.json(
      await validateLicense(await findLicense(licenseKey)),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const res = failure(error);
    const data = await res.json();
    return NextResponse.json({ ...data, valid: false }, { status: res.status });
  }
}
