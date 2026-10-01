import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { verifyOTP } from '@/lib/otp';
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
    const { email, otp, newPassword } = await req.json();

    if (!email || !otp || !newPassword) {
      return NextResponse.json({ error: 'Vui lòng điền đủ thông tin' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Mật khẩu phải từ 6 ký tự trở lên' }, { status: 400 });
    }

    const emailLower = email.toLowerCase().trim();

    // 1. Rate Limit
    const ip = getClientIp(req);
    const rateLimit = await checkRateLimit(`reset_pwd:${ip}`, 10, 60);
    if (!rateLimit.allowed) {
      return NextResponse.json({ 
        error: `Quá nhiều yêu cầu, vui lòng thử lại sau ${rateLimit.retryAfterSeconds}s` 
      }, { status: 429 });
    }

    // 2. Find OTP session
    const sessionsRef = db.collection('email_otp_sessions');
    const snapshot = await sessionsRef
      .where('email', '==', emailLower)
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ error: 'Không tìm thấy phiên xác thực hợp lệ' }, { status: 404 });
    }

    // Sort in memory to avoid Firestore composite index requirement
    const docs = snapshot.docs.map((doc: any) => ({ id: doc.id, data: doc.data() }));
    docs.sort((a: any, b: any) => b.data.created_at.toMillis() - a.data.created_at.toMillis());
    
    const sessionDoc = docs.find((doc: any) => doc.data.used === false && doc.data.invalidated === false);

    if (!sessionDoc) {
      return NextResponse.json({ error: 'Không tìm thấy phiên xác thực hợp lệ' }, { status: 404 });
    }

    const session = sessionDoc.data;
    const sessionId = sessionDoc.id;

    // 3. Check expiration
    const expiresAt = session.expires_at.toDate();
    if (new Date() > expiresAt) {
      await sessionsRef.doc(sessionId).update({ invalidated: true });
      return NextResponse.json({ error: 'Mã đã hết hạn, vui lòng gửi lại' }, { status: 400 });
    }

    // 4. Check attempts
    if (session.attempts >= session.max_attempts) {
      await sessionsRef.doc(sessionId).update({ invalidated: true });
      return NextResponse.json({ error: 'Đã vượt quá số lần thử. Vui lòng yêu cầu mã mới' }, { status: 429 });
    }

    // 5. Verify OTP (HMAC)
    const isValid = verifyOTP(otp, session.otp_hash);

    if (!isValid) {
      const newAttempts = session.attempts + 1;
      const updates: any = { attempts: newAttempts };
      
      let errorMsg = `Mã không đúng, còn ${session.max_attempts - newAttempts} lần thử`;
      
      if (newAttempts >= session.max_attempts) {
        updates.invalidated = true;
        errorMsg = 'Đã vượt quá số lần thử. Vui lòng yêu cầu mã mới';
      }
      
      await sessionsRef.doc(sessionId).update(updates);
      return NextResponse.json({ error: errorMsg, attemptsLeft: session.max_attempts - newAttempts }, { status: 400 });
    }

    // 6. Success - Update password
    await sessionsRef.doc(sessionId).update({ used: true });

    const hashedPassword = hashPassword(newPassword);
    await db.collection('users').doc(session.uid).update({
      password: hashedPassword
    });
    
    return NextResponse.json({ ok: true, message: 'Đổi mật khẩu thành công' });

  } catch (err) {
    console.error('Reset password error:', err);
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 });
  }
}
