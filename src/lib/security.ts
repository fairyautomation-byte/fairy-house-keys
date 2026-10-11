import { NextRequest, NextResponse } from "next/server";
import { createHash, randomUUID } from "node:crypto";
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    public messageOverride?: string,
    public retryAfter?: number,
    public retryable?: boolean,
  ) {
    super(messageOverride || code);
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
export function failure(
  error: unknown,
  reqOrCorrelationId?: NextRequest | string,
) {
  const correlationId =
    typeof reqOrCorrelationId === "string"
      ? reqOrCorrelationId
      : reqOrCorrelationId?.headers?.get("x-correlation-id") ||
        reqOrCorrelationId?.headers?.get("x-request-id") ||
        randomUUID();

  if (error instanceof ApiError) {
    const headers: Record<string, string> = {
      "x-correlation-id": correlationId,
    };
    if (error.retryAfter) {
      headers["Retry-After"] = String(error.retryAfter);
    }
    return NextResponse.json(
      {
        error: error.messageOverride || error.code,
        code: error.code,
        success: false,
        ok: false,
        retryable:
          error.retryable ?? (error.status >= 500 || error.status === 429),
        correlationId,
      },
      { status: error.status, headers },
    );
  }
  if (error instanceof Error && error.message.endsWith("_CONFIG_MISSING")) {
    console.error(`[${correlationId}] Configuration missing:`, error.message);
    return NextResponse.json(
      {
        error: `Lỗi cấu hình máy chủ: Thiếu biến môi trường ${error.message.replace("_CONFIG_MISSING", "")} trên Vercel. Vui lòng cấu hình trên Vercel Environment Variables.`,
        code: error.message,
        success: false,
        ok: false,
        retryable: true,
        correlationId,
      },
      {
        status: 503,
        headers: { "x-correlation-id": correlationId },
      },
    );
  }
  console.error(
    `[${correlationId}] API operation failed:`,
    error instanceof Error ? `${error.name}: ${error.message}` : "UnknownError",
  );
  return NextResponse.json(
    {
      error: "Lỗi hệ thống. Vui lòng thử lại sau.",
      code: "INTERNAL_SERVER_ERROR",
      success: false,
      ok: false,
      retryable: true,
      correlationId,
    },
    {
      status: 503,
      headers: { "x-correlation-id": correlationId },
    },
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

  let originUrl: URL;
  try {
    originUrl = new URL(origin);
  } catch {
    return false;
  }

  const allowed = new Set<string>();
  try {
    allowed.add(new URL(req.url).origin);
  } catch {}

  const proto =
    req.headers.get("x-forwarded-proto") ||
    req.nextUrl.protocol?.replace(":", "") ||
    "https";

  for (const h of [
    req.headers.get("x-forwarded-host"),
    req.headers.get("host"),
  ]) {
    if (h && /^[a-zA-Z0-9.-]+(?::[0-9]{1,5})?$/.test(h)) {
      allowed.add(`${proto}://${h}`);
      allowed.add(`https://${h}`);
      allowed.add(`http://${h}`);
    }
  }

  for (const raw of [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_BASE_URL,
  ]) {
    if (raw) {
      try {
        allowed.add(new URL(raw).origin);
      } catch {}
    }
  }

  const expanded = new Set(allowed);
  for (const item of allowed) {
    try {
      const u = new URL(item);
      if (u.hostname.startsWith("www.")) {
        expanded.add(`${u.protocol}//${u.hostname.slice(4)}${u.port ? `:${u.port}` : ""}`);
      } else {
        expanded.add(`${u.protocol}//www.${u.hostname}${u.port ? `:${u.port}` : ""}`);
      }
    } catch {}
  }

  if (expanded.has(origin)) return true;

  // Match bare hostname if both are under same root domain
  const originBare = originUrl.hostname.replace(/^www\./, "").toLowerCase();
  for (const item of expanded) {
    try {
      const itemBare = new URL(item).hostname.replace(/^www\./, "").toLowerCase();
      if (originBare === itemBare) return true;
    } catch {}
  }

  return false;
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
