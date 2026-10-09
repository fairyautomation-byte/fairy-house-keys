import { db } from "./firebase";
import { ApiError, digest, activeUser } from "./security";
export const vietnamDay = (now = new Date()) =>
  now.toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });
export const dateValue = (value: any) =>
  value?.toDate ? value.toDate() : value ? new Date(value) : null;
export function licenseView(data: any, now = new Date()) {
  const today = vietnamDay(now),
    expired = dateValue(data.expires_at);
  const status =
    data.status === "ACTIVE" && expired && expired.getTime() <= now.getTime()
      ? "EXPIRED"
      : data.status;
  const used =
    data.last_reset_date === today ? Number(data.daily_used || 0) : 0;
  return {
    valid: status === "ACTIVE",
    license_status: status,
    plan: data.plan_id || null,
    expires_at: expired?.toISOString() || null,
    daily_limit: data.daily_limit === undefined ? 0 : data.daily_limit,
    daily_used: used,
    remaining:
      data.daily_limit === -1 || data.daily_limit === null
        ? "Unlimited"
        : Math.max(
            0,
            (Number.isSafeInteger(data.daily_limit) ? data.daily_limit : 0) -
              used,
          ),
    total_scans: Number.isSafeInteger(data.total_scans) ? data.total_scans : 0,
    last_reset_date: today,
    server_date: today,
    entitlements: ["scan", "phone", "export", "gender", "fanpage"],
  };
}
export async function findLicense(key: unknown) {
  if (typeof key !== "string" || key.length > 80)
    throw new ApiError(400, "INVALID_LICENSE");
  const normalized = key.trim().toUpperCase();
  if (
    !/^(FHAD-(?:[A-Z0-9]{4}-){3}[A-Z0-9]{4}|(?:ZT|FH)-[A-Z0-9]+-[A-Z0-9]{16}-[A-Z0-9]{4})$/.test(
      normalized,
    )
  )
    throw new ApiError(400, "INVALID_LICENSE");
  const query = await db
    .collection("licenses")
    .where("license_key", "==", normalized)
    .limit(1)
    .get();
  if (query.empty) throw new ApiError(404, "LICENSE_NOT_FOUND");
  return query.docs[0].ref;
}
export async function validateLicense(
  ref: FirebaseFirestore.DocumentReference,
) {
  const snap = await ref.get();
  if (!snap.exists) throw new ApiError(404, "LICENSE_NOT_FOUND");
  const data = snap.data()!,
    owner = await db.collection("users").doc(data.user_id).get();
  if (!owner.exists || !activeUser(owner.data()))
    throw new ApiError(403, "LICENSE_REVOKED");
  const view = licenseView(data);
  if (!view.valid) throw new ApiError(403, `LICENSE_${view.license_status}`);
  return view;
}
export function scanInput(action: unknown, count: unknown, requestId: unknown) {
  if (!["check", "consume"].includes(String(action)))
    throw new ApiError(400, "INVALID_ACTION");
  if (
    typeof count !== "number" ||
    !Number.isSafeInteger(count) ||
    count < 1 ||
    count > 500
  )
    throw new ApiError(400, "INVALID_COUNT");
  if (
    action === "consume" &&
    (typeof requestId !== "string" ||
      !/^[a-zA-Z0-9_-]{16,128}$/.test(requestId))
  )
    throw new ApiError(400, "REQUEST_ID_REQUIRED");
}
export async function consumeQuota(
  ref: FirebaseFirestore.DocumentReference,
  action: string,
  count: number,
  requestId?: string,
) {
  scanInput(action, count, requestId);
  const receipt = db
    .collection("usage_requests")
    .doc(digest(`${ref.id}:${requestId}`));
  return db.runTransaction(
    async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) throw new ApiError(404, "LICENSE_NOT_FOUND");
      const data = snap.data()!;
      const owner = await tx.get(db.collection("users").doc(data.user_id));
      if (!owner.exists || !activeUser(owner.data()))
        throw new ApiError(403, "LICENSE_REVOKED");
      const view = licenseView(data);
      if (!view.valid)
        throw new ApiError(403, `LICENSE_${view.license_status}`);
      const previous = action === "consume" ? await tx.get(receipt) : null;
      if (previous?.exists) {
        if (previous.data()!.count !== count)
          throw new ApiError(409, "REQUEST_ID_CONFLICT");
        return previous.data()!.response;
      }
      if (
        data.daily_limit !== -1 &&
        data.daily_limit !== null &&
        (!Number.isSafeInteger(data.daily_limit) ||
          view.daily_used + count > data.daily_limit)
      )
        throw new ApiError(429, "DAILY_LIMIT_REACHED");
      if (action === "check") return { success: true, ...view };
      const used = view.daily_used + count;
      const response = {
        ...view,
        success: true,
        daily_used: used,
        remaining:
          data.daily_limit === -1 || data.daily_limit === null
            ? "Unlimited"
            : Math.max(
                0,
                (Number.isSafeInteger(data.daily_limit)
                  ? data.daily_limit
                  : 0) - used,
              ),
        total_scans: view.total_scans + count,
      };
      tx.update(ref, {
        daily_used: used,
        total_scans: response.total_scans,
        last_reset_date: view.server_date,
      });
      tx.set(receipt, {
        license_id: ref.id,
        count,
        response,
        created_at: new Date(),
        expires_at: new Date(Date.now() + 7 * 86400000),
      });
      return response;
    },
    { maxAttempts: 20 },
  );
}
