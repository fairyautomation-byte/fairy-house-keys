import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { sameOrigin } from "@/lib/security";
import { ADMIN_COOKIE_NAME, USER_COOKIE_NAME } from "@/lib/auth";
import { accountReturnPath } from "@/lib/auth-redirect";

/** Lightweight JWT check for middleware — no Firestore, Edge-safe. */
async function hasValidToken(req: NextRequest, cookieName: string, role: string) {
  const value = req.cookies.get(cookieName)?.value;
  if (!value) return false;
  const payload = await verifyToken(value);
  return payload?.role === role;
}

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  if (path.startsWith("/api/")) {
    const independent =
      path === "/api/payos/webhook" ||
      path.startsWith("/api/license/") ||
      path === "/api/verify-key";
    if (
      !independent &&
      !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
      !sameOrigin(req)
    )
      return NextResponse.json({ error: "ORIGIN_DENIED" }, { status: 403 });
    const res = NextResponse.next();
    res.headers.set("Cache-Control", "no-store");
    return res;
  }
  try {
    if (
      path.startsWith("/admin") &&
      path !== "/admin/login" &&
      !(await hasValidToken(req, ADMIN_COOKIE_NAME, "admin"))
    )
      return NextResponse.redirect(new URL("/admin/login", req.url));

    const isUserRoute =
      path.startsWith("/dashboard") ||
      path.startsWith("/checkout") ||
      path === "/login" ||
      path === "/register";

    if (isUserRoute) {
      const authenticated = await hasValidToken(req, USER_COOKIE_NAME, "user");

      if (
        (path.startsWith("/dashboard") || path.startsWith("/checkout")) &&
        !authenticated
      ) {
        const login = new URL("/login", req.url);
        login.searchParams.set("next", path + req.nextUrl.search);
        return NextResponse.redirect(login);
      }

      if ((path === "/login" || path === "/register") && authenticated) {
        // Login must remain reachable for a signed JWT whose server-side session was revoked.
        if (path === "/login") return NextResponse.next();
        const plan = req.nextUrl.searchParams.get("plan");
        return NextResponse.redirect(
          new URL(
            accountReturnPath(req.nextUrl.searchParams.get("next")) || (plan && ["trial", "monthly", "quarterly", "yearly"].includes(plan)
              ? `/checkout?plan=${plan}`
              : "/dashboard"),
            req.url,
          ),
        );
      }
    }
  } catch {
    return NextResponse.json(
      { error: "Dịch vụ tạm thời chưa sẵn sàng" },
      { status: 503 },
    );
  }
  return NextResponse.next();
}
export const config = {
  matcher: [
    "/api/:path*",
    "/admin/:path*",
    "/dashboard/:path*",
    "/checkout/:path*",
    "/login",
    "/register",
  ],
};

