import { deliverLicenseEmail } from "@/lib/notifications";
import { digest } from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { buyWithWallet } from "@/lib/order-service";
import { jsonBody, failure, ApiError } from "@/lib/security";
import { checkRateLimit } from "@/lib/rate-limit";
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) throw new ApiError(401, "Unauthorized");
    if (!(await checkRateLimit(`buy:${user.uid}`, 10, 60)).allowed)
      throw new ApiError(429, "RATE_LIMIT_EXCEEDED");
    const { planId, requestId } = await jsonBody(req);
    const result = await buyWithWallet(user.uid, planId, requestId);
    await deliverLicenseEmail(digest(`wallet:${user.uid}:${requestId}`));
    return NextResponse.json(result);
  } catch (error) {
    return failure(error);
  }
}
