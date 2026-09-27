import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { signUserToken, USER_COOKIE_NAME } from '@/lib/auth';
import * as crypto from 'crypto';

function hashPassword(password: string) {
  return crypto.createHash('sha256').update(password + (process.env.KEY_SECRET_SALT || 'salt')).digest('hex');
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Thiếu email hoặc mật khẩu' }, { status: 400 });
    }

    const emailLower = email.toLowerCase().trim();
    const hashedPassword = hashPassword(password);

    const usersRef = db.collection('users');
    const userSnap = await usersRef.where('email', '==', emailLower).where('password', '==', hashedPassword).limit(1).get();

    if (userSnap.empty) {
      return NextResponse.json({ error: 'Email hoặc mật khẩu không chính xác' }, { status: 401 });
    }

    const doc = userSnap.docs[0];
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
