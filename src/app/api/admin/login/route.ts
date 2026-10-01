import { NextRequest, NextResponse } from 'next/server';
import { validateAdminCredentials, signAdminToken, ADMIN_COOKIE_NAME } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
    const rateLimit = await checkRateLimit(`admin_login:${ip}`, 5, 300); // 5 attempts per 5 minutes
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Quá nhiều yêu cầu. Vui lòng thử lại sau 5 phút.' }, { status: 429 });
    }

    const { username, password } = await req.json();
    if (!validateAdminCredentials(username, password)) {
      return NextResponse.json({ error: 'Sai tên đăng nhập hoặc mật khẩu' }, { status: 401 });
    }
    const token = await signAdminToken();
    const res = NextResponse.json({ ok: true });
    res.cookies.set(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });
    return res;
  } catch {
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(ADMIN_COOKIE_NAME);
  return res;
}
