import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated, getAuthenticatedUser } from '@/lib/auth';

export async function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  // Protect all /admin/* routes except /admin/login
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const isAuth = await isAdminAuthenticated(req);
    if (!isAuth) {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }
  }

  // Protect all /dashboard/* and /checkout routes
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/checkout')) {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  // Redirect authenticated users away from auth pages
  if (pathname === '/login' || pathname === '/register') {
    const user = await getAuthenticatedUser(req);
    if (user) {
      const plan = searchParams.get('plan');
      if (plan) {
        return NextResponse.redirect(new URL(`/checkout?plan=${plan}`, req.url));
      }
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*', '/checkout/:path*', '/login', '/register'],
};
