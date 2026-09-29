import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { verifyOTP } from '@/lib/otp';
import { checkRateLimit } from '@/lib/rate-limit';
import { signUserToken, USER_COOKIE_NAME } from '@/lib/auth';
import { sendNewUserWelcome, sendNewUserAdminNotification } from '@/lib/mailer';
function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return 'unknown';
}

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ error: 'Thiếu email hoặc mã xác thực' }, { status: 400 });
    }

    const emailLower = email.toLowerCase().trim();

    // 1. Rate Limit
    const ip = getClientIp(req);
    const rateLimit = await checkRateLimit(`verify_otp:${ip}`, 10, 60);
    if (!rateLimit.allowed) {
      return NextResponse.json({ 
        error: `Quá nhiều yêu cầu, vui lòng thử lại sau ${rateLimit.retryAfterSeconds}s` 
      }, { status: 429 });
    }

    // 2. Tìm OTP session
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

    // 3. Kiểm tra hết hạn
    const expiresAt = session.expires_at.toDate();
    if (new Date() > expiresAt) {
      await sessionsRef.doc(sessionId).update({ invalidated: true });
      return NextResponse.json({ error: 'Mã đã hết hạn, vui lòng gửi lại' }, { status: 400 });
    }

    // 4. Kiểm tra số lần thử
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

    // 6. Thành công
    const now = new Date();
    
    // Update OTP session
    await sessionsRef.doc(sessionId).update({ used: true });

    // Fetch user to send welcome email
    const userRef = db.collection('users').doc(session.uid);
    const userDoc = await userRef.get();
    
    // Update user
    await userRef.update({
      email_verified: true,
      email_verified_at: now
    });

    if (userDoc.exists) {
      const userData = userDoc.data()!;
      // Only send if it's the first time verifying
      if (userData.email_verified === false) {
        await Promise.allSettled([
          sendNewUserWelcome({
            fullName: userData.full_name,
            email: emailLower,
          }),
          sendNewUserAdminNotification({
            fullName: userData.full_name,
            email: emailLower,
            zalo: userData.zalo,
          })
        ]).catch(console.error);
      }
    }

    // 7. Login
    const token = await signUserToken(session.uid, emailLower);
    
    const res = NextResponse.json({ ok: true, message: 'Xác thực thành công' });
    res.cookies.set(USER_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });
    
    return res;

  } catch (err) {
    console.error('Verify OTP error:', err);
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 });
  }
}
