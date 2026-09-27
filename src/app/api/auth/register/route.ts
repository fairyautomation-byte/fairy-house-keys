import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { signUserToken, USER_COOKIE_NAME } from '@/lib/auth';
import { sendNewUserWelcome, sendNewUserAdminNotification } from '@/lib/mailer';
import * as crypto from 'crypto';

function hashPassword(password: string) {
  return crypto.createHash('sha256').update(password + (process.env.KEY_SECRET_SALT || 'salt')).digest('hex');
}

export async function POST(req: NextRequest) {
  try {
    const { fullName, email, password, zalo } = await req.json();

    if (!fullName || !email || !password) {
      return NextResponse.json({ error: 'Vui lòng điền đủ thông tin' }, { status: 400 });
    }

    const emailLower = email.toLowerCase().trim();
    
    // Check if user exists
    const usersRef = db.collection('users');
    const existing = await usersRef.where('email', '==', emailLower).limit(1).get();
    
    if (!existing.empty) {
      return NextResponse.json({ error: 'Email đã được sử dụng' }, { status: 409 });
    }

    const hashedPassword = hashPassword(password);
    
    const newUser = {
      full_name: fullName.trim(),
      email: emailLower,
      zalo: (zalo || '').trim(),
      password: hashedPassword,
      role: 'USER',
      trial_used: false,
      created_at: new Date(),
    };

    const docRef = await usersRef.add(newUser);
    
    // Gửi email chào mừng và báo admin (await để không bị Vercel kill)
    const emailResults = await Promise.allSettled([
      sendNewUserWelcome({
        fullName: newUser.full_name,
        email: newUser.email,
      }),
      sendNewUserAdminNotification({
        fullName: newUser.full_name,
        email: newUser.email,
        zalo: newUser.zalo,
      })
    ]);

    emailResults.forEach((res, index) => {
      if (res.status === 'rejected') {
        console.error(`Email send failed for index ${index}:`, res.reason);
      }
    });

    // Auto login
    const token = await signUserToken(docRef.id, emailLower);
    
    const res = NextResponse.json({ ok: true, uid: docRef.id });
    res.cookies.set(USER_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });
    
    return res;
  } catch (err) {
    console.error('Register error:', err);
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 });
  }
}
