import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { signUserToken, USER_COOKIE_NAME } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import * as crypto from 'crypto';

function hashPassword(password: string) {
  return crypto.createHash('sha256').update(password + (process.env.KEY_SECRET_SALT || '')).digest('hex');
}

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return 'unknown';
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Thiếu email hoặc mật khẩu' }, { status: 400 });
    }

    const emailLower = email.toLowerCase().trim();

    // 1. Rate Limit IP (5 requests / min)
    const ip = getClientIp(req);
    const rateLimit = await checkRateLimit(`login:${ip}`, 5, 60);
    if (!rateLimit.allowed) {
      return NextResponse.json({ 
        error: `Quá nhiều yêu cầu, vui lòng thử lại sau ${rateLimit.retryAfterSeconds}s` 
      }, { status: 429 });
    }

    const hashedPassword = hashPassword(password);

    const usersRef = db.collection('users');
    const userSnap = await usersRef.where('email', '==', emailLower).where('password', '==', hashedPassword).limit(1).get();

    if (userSnap.empty) {
      return NextResponse.json({ error: 'Email hoặc mật khẩu không chính xác' }, { status: 401 });
    }

    const doc = userSnap.docs[0];
    const userData = doc.data();

    // 2. Check if email is verified
    if (userData.email_verified === false) {
      return NextResponse.json({ 
        error: 'Tài khoản chưa được xác thực email.', 
        code: 'EMAIL_NOT_VERIFIED',
        email: emailLower 
      }, { status: 403 });
    }

    const token = await signUserToken(doc.id, emailLower);
    
    const res = NextResponse.json({ ok: true, uid: doc.id });
    res.cookies.set(USER_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });
    
    return res;
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(USER_COOKIE_NAME);
  return res;
}
