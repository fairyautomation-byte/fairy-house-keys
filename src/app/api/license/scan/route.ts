import { NextRequest, NextResponse } from "next/server";
import { findLicense, consumeQuota, scanInput, validateLicense } from "@/lib/license-service";
import { jsonBody, failure, ApiError } from "@/lib/security";
import { checkRateLimit } from "@/lib/rate-limit";
export async function POST(req: NextRequest) {
  try {
    const {
      licenseKey,
      action = "consume",
      count = 1,
      requestId,
      installationId,
    } = await jsonBody(req);
    scanInput(action, count, requestId);
    const ref = await findLicense(licenseKey);
    await validateLicense(ref, installationId);
    if (!(await checkRateLimit(`scan:${ref.id}`, 300, 60)).allowed)
      throw new ApiError(429, "RATE_LIMIT_EXCEEDED");
    return NextResponse.json(await consumeQuota(ref, action, count, requestId));
  } catch (error) {
    return failure(error, req);
  }
}

