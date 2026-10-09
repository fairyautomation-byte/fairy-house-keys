import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import {
  findLicense,
  consumeQuota,
  validateLicense,
} from "@/lib/license-service";
import { jsonBody, ApiError, failure, digest } from "@/lib/security";
import { checkRateLimit } from "@/lib/rate-limit";
function merge(map: Record<string, string>, value: any, requested: string[]) {
  const add = (uid: unknown, phone: unknown) => {
    const id = String(uid || "");
    if (
      !requested.includes(id) ||
      (typeof phone !== "string" && typeof phone !== "number")
    )
      return;
    const text = String(phone).trim();
    if (text && text.length <= 80 && !/^phone\s*number$/i.test(text))
      map[id] = text;
  };
  const rows = Array.isArray(value?.phones)
    ? value.phones
    : Array.isArray(value?.data)
      ? value.data
      : Array.isArray(value?.rows)
        ? value.rows
        : Array.isArray(value?.result)
          ? value.result
          : [];
  for (const row of rows)
    add(
      row.uid ?? row.UID ?? row.user_id ?? row.fb_id ?? row.id,
      row.phone ?? row.Phone ?? row.mobile ?? row.tel ?? row.PhoneNumber,
    );
  for (const uid of requested) {
    add(uid, value?.map?.[uid]);
    add(uid, value?.[uid]);
  }
}
async function lookup(uids: string[], database: string) {
  const response = await fetch(`https://phone.zooinbox.com/${database}/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.PHONE_PROVIDER_TOKEN
        ? { Authorization: `Bearer ${process.env.PHONE_PROVIDER_TOKEN}` }
        : {}),
    },
    body: JSON.stringify({ action: "uids2phones", uids }),
    signal: AbortSignal.timeout(15000),
    redirect: "error",
    cache: "no-store",
  });
  if (!response.ok) throw new ApiError(502, "PHONE_PROVIDER_UNAVAILABLE");
  return response.json();
}
export async function POST(req: NextRequest) {
  try {
    const { licenseKey, uids, requestId } = await jsonBody(req);
    if (
      !Array.isArray(uids) ||
      !uids.length ||
      uids.length > 500 ||
      uids.some((u) => typeof u !== "string" || !/^\d{5,20}$/.test(u)) ||
      new Set(uids).size !== uids.length
    )
      throw new ApiError(400, "INVALID_UIDS");
    if (
      typeof requestId !== "string" ||
      !/^[a-zA-Z0-9_-]{16,128}$/.test(requestId)
    )
      throw new ApiError(400, "REQUEST_ID_REQUIRED");
    const ref = await findLicense(licenseKey);
    await validateLicense(ref);
    if (!(await checkRateLimit(`phones:${ref.id}`, 120, 60)).allowed)
      throw new ApiError(429, "RATE_LIMIT_EXCEEDED");
    const receipt = db
        .collection("phone_requests")
        .doc(digest(`${ref.id}:${requestId}`)),
      fingerprint = digest(JSON.stringify(uids));
    const previous = await receipt.get();
    if (previous.exists && previous.data()!.fingerprint !== fingerprint)
      throw new ApiError(409, "REQUEST_ID_CONFLICT");
    if (previous.data()?.result)
      return NextResponse.json(previous.data()!.result);
    await db.runTransaction(
      async (tx) => {
        const existing = await tx.get(receipt);
        if (existing.exists && existing.data()!.fingerprint !== fingerprint)
          throw new ApiError(409, "REQUEST_ID_CONFLICT");
        if (!existing.exists)
          tx.set(receipt, {
            fingerprint,
            created_at: new Date(),
            expires_at: new Date(Date.now() + 7 * 86400000),
          });
      },
      { maxAttempts: 20 },
    );
    // Quota charges requested unique UIDs once, including provider retries. No client-controlled refunds.
    const quota = await consumeQuota(ref, "consume", uids.length, requestId),
      map: Record<string, string> = {};
    merge(map, await lookup(uids, "db1"), uids);
    const missing = uids.filter((uid) => !map[uid]);
    if (missing.length) merge(map, await lookup(missing, "db2"), missing);
    await validateLicense(ref);
    const result = { ok: true, phoneMap: map, quota };
    await receipt.update({ result });
    return NextResponse.json(result);
  } catch (error) {
    return failure(error);
  }
}
