import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated, getAuthenticatedUser } from '@/lib/auth';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protect all /admin/* routes except /admin/login
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const isAuth = await isAdminAuthenticated(req);
    if (!isAuth) {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }
  }

  // Protect all /dashboard/* routes
  if (pathname.startsWith('/dashboard')) {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*'],
};
