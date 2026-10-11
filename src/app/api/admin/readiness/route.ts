import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { db } from "@/lib/firebase";
import { failure, ApiError } from "@/lib/security";

export async function GET(req: NextRequest) {
  try {
    const readinessToken = req.headers.get("x-readiness-token");
    const validToken =
      process.env.ADMIN_READINESS_SECRET &&
      readinessToken === process.env.ADMIN_READINESS_SECRET;

    if (!validToken && !(await isAdminAuthenticated(req))) {
      throw new ApiError(401, "Unauthorized");
    }

    const checks: Record<
      string,
      { ok: boolean; status: string; message: string }
    > = {};

    // 1. JWT Configuration
    const jwtSecret = process.env.JWT_SECRET || "";
    if (jwtSecret.length >= 32) {
      checks.jwt = {
        ok: true,
        status: "PASS",
        message: "JWT secret configured with sufficient entropy",
      };
    } else {
      checks.jwt = {
        ok: false,
        status: "FAIL",
        message: "JWT_SECRET missing or shorter than 32 characters",
      };
    }

    // 2. OTP Configuration
    const otpSecret = process.env.OTP_SECRET_KEY || "";
    if (otpSecret.length >= 32) {
      checks.otp = {
        ok: true,
        status: "PASS",
        message: "OTP secret key configured with sufficient entropy",
      };
    } else {
      checks.otp = {
        ok: false,
        status: "FAIL",
        message: "OTP_SECRET_KEY missing or shorter than 32 characters",
      };
    }

    // 3. Password Key Salt
    if (process.env.KEY_SECRET_SALT) {
      checks.keySalt = {
        ok: true,
        status: "PASS",
        message: "Legacy password salt configured",
      };
    } else {
      checks.keySalt = {
        ok: false,
        status: "FAIL",
        message: "KEY_SECRET_SALT missing",
      };
    }

    // 4. Admin Credentials
    if (process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD) {
      checks.adminAuth = {
        ok: true,
        status: "PASS",
        message: "Admin credentials configured",
      };
    } else {
      checks.adminAuth = {
        ok: false,
        status: "FAIL",
        message: "ADMIN_USERNAME or ADMIN_PASSWORD missing",
      };
    }

    // 5. Firebase / Firestore connectivity
    try {
      const projectId = process.env.FIREBASE_PROJECT_ID;
      if (!projectId) {
        checks.firestore = {
          ok: false,
          status: "FAIL",
          message: "FIREBASE_PROJECT_ID missing",
        };
      } else {
        // Safe read ping
        await db.collection("system").doc("ping").get();
        checks.firestore = {
          ok: true,
          status: "PASS",
          message: "Firestore connected and readable",
        };
      }
    } catch (err) {
      checks.firestore = {
        ok: false,
        status: "FAIL",
        message: `Firestore connection error: ${err instanceof Error ? err.message : "Unknown"}`,
      };
    }

    // 6. PayOS Configuration
    const payosClientId = process.env.PAYOS_CLIENT_ID;
    const payosApiKey = process.env.PAYOS_API_KEY;
    const payosChecksum = process.env.PAYOS_CHECKSUM_KEY;
    if (payosClientId && payosApiKey && payosChecksum) {
      checks.payos = {
        ok: true,
        status: "PASS",
        message: "PayOS credentials configured",
      };
    } else {
      checks.payos = {
        ok: false,
        status: "FAIL",
        message: "PAYOS credentials (CLIENT_ID, API_KEY, CHECKSUM_KEY) missing",
      };
    }

    // 7. SMTP Email Configuration
    if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
      checks.smtp = {
        ok: true,
        status: "PASS",
        message: "Gmail SMTP credentials configured",
      };
    } else {
      checks.smtp = {
        ok: false,
        status: "DEGRADED",
        message: "GMAIL credentials missing (notifications degraded)",
      };
    }

    // 8. Public URLs
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    if (appUrl && baseUrl) {
      checks.urls = {
        ok: true,
        status: "PASS",
        message: "APP_URL and BASE_URL configured",
      };
    } else {
      checks.urls = {
        ok: false,
        status: "DEGRADED",
        message: "NEXT_PUBLIC_APP_URL or NEXT_PUBLIC_BASE_URL missing",
      };
    }

    const hasCriticalFailures = Object.entries(checks).some(
      ([key, c]) => key !== "smtp" && key !== "urls" && !c.ok,
    );
    const hasDegraded = Object.values(checks).some(
      (c) => c.status === "DEGRADED",
    );

    const overallStatus = hasCriticalFailures
      ? "NOT_READY"
      : hasDegraded
        ? "DEGRADED"
        : "READY";

    return NextResponse.json(
      {
        ok: !hasCriticalFailures,
        status: overallStatus,
        checks,
        timestamp: new Date().toISOString(),
      },
      {
        status: hasCriticalFailures ? 503 : 200,
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (error) {
    return failure(error, req);
  }
}
