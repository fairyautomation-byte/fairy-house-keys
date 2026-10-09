import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated, getAuthenticatedUser } from "@/lib/auth";
import { sameOrigin } from "@/lib/security";
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
      !(await isAdminAuthenticated(req))
    )
      return NextResponse.redirect(new URL("/admin/login", req.url));
    const user =
      path.startsWith("/dashboard") ||
      path.startsWith("/checkout") ||
      path === "/login" ||
      path === "/register"
        ? await getAuthenticatedUser(req)
        : null;
    if (
      (path.startsWith("/dashboard") || path.startsWith("/checkout")) &&
      !user
    )
      return NextResponse.redirect(new URL("/login", req.url));
    if ((path === "/login" || path === "/register") && user) {
      const plan = req.nextUrl.searchParams.get("plan");
      return NextResponse.redirect(
        new URL(
          plan && ["trial", "monthly", "quarterly", "yearly"].includes(plan)
            ? `/checkout?plan=${plan}`
            : "/dashboard",
          req.url,
        ),
      );
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
