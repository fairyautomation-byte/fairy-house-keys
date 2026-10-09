import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
  ) {
    super(code);
  }
}
export const digest = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export function emailAddress(value: unknown): string {
  if (
    typeof value !== "string" ||
    value.length > 254 ||
    !/^[^\s<>;,"\r\n]+@[^\s<>;,"\r\n]+\.[^\s<>;,"\r\n]+$/.test(value)
  )
    throw new ApiError(400, "INVALID_EMAIL");
  return value.trim().toLowerCase();
}
export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 604800,
  path: "/",
};
export function failure(error: unknown) {
  if (error instanceof ApiError)
    return NextResponse.json(
      { error: error.code, code: error.code, success: false },
      { status: error.status },
    );
  console.error(
    "API operation failed",
    error instanceof Error ? error.name : "UnknownError",
  );
  return NextResponse.json(
    { error: "Lỗi hệ thống. Vui lòng thử lại sau.", success: false },
    { status: 503 },
  );
}
export async function jsonBody(req: NextRequest): Promise<any> {
  if (!req.headers.get("content-type")?.startsWith("application/json"))
    throw new ApiError(415, "JSON_REQUIRED");
  if (Number(req.headers.get("content-length") || 0) > 32768)
    throw new ApiError(413, "REQUEST_TOO_LARGE");
  const text = await req.text();
  if (Buffer.byteLength(text) > 32768)
    throw new ApiError(413, "REQUEST_TOO_LARGE");
  try {
    const value = JSON.parse(text);
    if (!value || Array.isArray(value) || typeof value !== "object")
      throw new Error();
    return value;
  } catch {
    throw new ApiError(400, "INVALID_JSON");
  }
}
export function sameOrigin(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (req.headers.get("sec-fetch-site") === "cross-site") return false;
  if (!origin)
    return (
      req.headers.get("sec-fetch-site") === "same-origin" ||
      process.env.NODE_ENV !== "production"
    );
  const allowed = new Set([new URL(req.url).origin]);
  // Next may normalize the internal hostname; use the browser-facing Host too.
  const host = req.headers.get("host");
  if (host && /^[a-zA-Z0-9.-]+(?::[0-9]{1,5})?$/.test(host))
    allowed.add(new URL(`${req.nextUrl.protocol}//${host}`).origin);
  for (const raw of [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_BASE_URL,
  ])
    if (raw) allowed.add(new URL(raw).origin);
  return allowed.has(origin);
}
export function activeUser(user: any) {
  return (
    !!user &&
    user.status !== "SUSPENDED" &&
    user.status !== "DELETED" &&
    user.status !== "REVOKED" &&
    user.disabled !== true
  );
}
export function publicUser(data: any) {
  const fields = [
    "email",
    "full_name",
    "zalo",
    "role",
    "trial_used",
    "email_verified",
    "created_at",
    "wallet_balance",
    "status",
  ];
  return Object.fromEntries(
    fields.filter((k) => data[k] !== undefined).map((k) => [k, data[k]]),
  );
}
