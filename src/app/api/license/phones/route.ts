import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/firebase";
import {
  findLicense,
  consumeQuota,
  validateLicense,
  refundSystemQuota,
} from "@/lib/license-service";
import { jsonBody, ApiError, failure, digest } from "@/lib/security";
import { checkRateLimit } from "@/lib/rate-limit";

function merge(
  map: Record<string, string>,
  value: any,
  requested: string[],
) {
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

async function safeLookup(
  uids: string[],
  database: string,
  signal: AbortSignal,
): Promise<{ ok: boolean; data?: any; error?: string; isHtml?: boolean }> {
  try {
    const response = await fetch(`https://phone.zooinbox.com/${database}/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.PHONE_PROVIDER_TOKEN
          ? { Authorization: `Bearer ${process.env.PHONE_PROVIDER_TOKEN}` }
          : {}),
      },
      body: JSON.stringify({ action: "uids2phones", uids }),
      signal,
      redirect: "error",
      cache: "no-store",
    });

    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("text/html")) {
      return { ok: false, error: "PROVIDER_HTML_ERROR", isHtml: true };
    }

    if (!response.ok) {
      return { ok: false, error: `PROVIDER_HTTP_${response.status}` };
    }

    try {
      const data = await response.json();
      return { ok: true, data };
    } catch {
      return { ok: false, error: "PROVIDER_MALFORMED_JSON" };
    }
  } catch (err: any) {
    if (err.name === "AbortError" || signal.aborted) {
      return { ok: false, error: "PROVIDER_DEADLINE_EXCEEDED" };
    }
    return { ok: false, error: err.message || "PROVIDER_NETWORK_ERROR" };
  }
}

export async function POST(req: NextRequest) {
  try {
    const { licenseKey, uids, requestId, installationId } =
      await jsonBody(req);
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
    await validateLicense(ref, installationId);

    if (!(await checkRateLimit(`phones:${ref.id}`, 120, 60)).allowed)
      throw new ApiError(429, "RATE_LIMIT_EXCEEDED", undefined, 60, true);

    const receipt = db
      .collection("phone_requests")
      .doc(digest(`${ref.id}:${requestId}`));

    // Normalize UIDs for deterministic fingerprint regardless of array ordering
    const normalizedUids = [...uids].sort();
    const fingerprint = digest(JSON.stringify(normalizedUids));
    const myLeaseToken = randomUUID();
    const now = Date.now();

    // Acquire lease or return existing cached result atomically
    const claim = await db.runTransaction(
      async (tx) => {
        const snap = await tx.get(receipt);
        if (snap.exists) {
          const data = snap.data()!;
          if (data.fingerprint !== fingerprint) {
            throw new ApiError(409, "REQUEST_ID_CONFLICT");
          }
          if (data.status === "COMPLETED" && data.result) {
            return { action: "COMPLETED", result: data.result };
          }
          // If currently processing and lease has not expired, fence concurrent execution
          const leaseUntil = data.lease_until ? data.lease_until.toMillis() : 0;
          if (data.status === "PROCESSING" && leaseUntil > now) {
            return { action: "IN_PROGRESS", retryAfter: 3 };
          }
        }

        // Claim execution lease for 14 seconds (matching overall server timeout)
        tx.set(
          receipt,
          {
            fingerprint,
            status: "PROCESSING",
            lease_token: myLeaseToken,
            lease_until: new Date(now + 14000),
            created_at: snap.exists ? snap.data()!.created_at : new Date(),
            expires_at: new Date(now + 7 * 86400000),
          },
          { merge: true },
        );
        return { action: "ACQUIRED" };
      },
      { maxAttempts: 20 },
    );

    if (claim.action === "COMPLETED") {
      return NextResponse.json(claim.result);
    }

    if (claim.action === "IN_PROGRESS") {
      throw new ApiError(
        429,
        "OPERATION_IN_PROGRESS",
        "Yêu cầu đang được xử lý, vui lòng thử lại sau giây lát.",
        claim.retryAfter,
        true,
      );
    }

    // Server-wide deadline budget: 12 seconds total (leaves safety margin for client 20s timeout)
    const timeoutSignal = AbortSignal.timeout(12000);

    // Consume quota atomically. Note: quota charges requested unique UIDs.
    const quota = await consumeQuota(ref, "consume", uids.length, requestId);
    const map: Record<string, string> = {};

    let db1Success = false;
    let db2Success = false;

    // Call DB1
    const resDb1 = await safeLookup(uids, "db1", timeoutSignal);
    if (resDb1.ok && resDb1.data) {
      db1Success = true;
      merge(map, resDb1.data, uids);
    }

    // If UIDs are missing, or if db1 failed completely, try DB2 with remaining budget
    const missing = uids.filter((uid) => !map[uid]);
    if (missing.length && !timeoutSignal.aborted) {
      const resDb2 = await safeLookup(missing, "db2", timeoutSignal);
      if (resDb2.ok && resDb2.data) {
        db2Success = true;
        merge(map, resDb2.data, missing);
      }
    }

    // Check system error status: if both providers failed to respond and 0 phones found
    if (!db1Success && !db2Success && Object.keys(map).length === 0) {
      // System failure: rollback quota and mark receipt failed so retry can succeed cleanly
      await refundSystemQuota(ref, uids.length, requestId);
      await receipt.update({
        status: "FAILED",
        last_error: resDb1.error || "PHONE_PROVIDERS_UNAVAILABLE",
      });
      throw new ApiError(
        502,
        "PHONE_PROVIDER_UNAVAILABLE",
        "Máy chủ tra cứu SĐT tạm thời gián đoạn. Hạn mức đã được bảo toàn.",
        5,
        true,
      );
    }

    await validateLicense(ref, installationId);
    const result = {
      ok: true,
      phoneMap: map,
      quota,
      partial: missing.length > 0 && Object.keys(map).length > 0,
    };

    await receipt.update({
      status: "COMPLETED",
      result,
      completed_at: new Date(),
    });

    return NextResponse.json(result);
  } catch (error) {
    return failure(error, req);
  }
}
