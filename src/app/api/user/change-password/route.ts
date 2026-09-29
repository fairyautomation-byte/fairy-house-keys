import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { getAuthenticatedUser } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import * as crypto from 'crypto';

function hashPassword(password: string) {
  return crypto.createHash('sha256').update(password + (process.env.KEY_SECRET_SALT || 'salt')).digest('hex');
}

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return 'unknown';
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { oldPassword, newPassword } = await req.json();

    if (!oldPassword || !newPassword) {
      return NextResponse.json({ error: 'Vui lòng điền đủ thông tin' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Mật khẩu mới phải từ 6 ký tự' }, { status: 400 });
    }

    // 1. Rate Limit
    const ip = getClientIp(req);
    const rateLimit = await checkRateLimit(`change_pwd:${user.uid}`, 5, 60); // 5 attempts per minute per user
    if (!rateLimit.allowed) {
      return NextResponse.json({ 
        error: `Quá nhiều yêu cầu, vui lòng thử lại sau ${rateLimit.retryAfterSeconds}s` 
      }, { status: 429 });
    }

    // 2. Fetch user
    const userRef = db.collection('users').doc(user.uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json({ error: 'Tài khoản không tồn tại' }, { status: 404 });
    }

    const userData = userDoc.data()!;
    const oldHashedPassword = hashPassword(oldPassword);

    // 3. Verify old password
    if (userData.password !== oldHashedPassword) {
      return NextResponse.json({ error: 'Mật khẩu cũ không chính xác' }, { status: 400 });
    }

    // 4. Update new password
    const newHashedPassword = hashPassword(newPassword);
    await userRef.update({ password: newHashedPassword });

    return NextResponse.json({ ok: true, message: 'Đổi mật khẩu thành công' });

  } catch (err) {
    console.error('Change password error:', err);
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 });
  }
}
