import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { generateOTP, hashOTP } from '@/lib/otp';
import { sendOTPEmail } from '@/lib/mailer';
import { checkRateLimit } from '@/lib/rate-limit';

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return 'unknown';
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Vui lòng cung cấp email' }, { status: 400 });
    }

    const emailLower = email.toLowerCase().trim();
    const ip = getClientIp(req);

    // 1. IP Rate Limit for Resend (5 per minute)
    const ipRateLimit = await checkRateLimit(`resend_otp:${ip}`, 5, 60);
    if (!ipRateLimit.allowed) {
      return NextResponse.json({ 
        error: `Quá nhiều yêu cầu, vui lòng thử lại sau ${ipRateLimit.retryAfterSeconds}s` 
      }, { status: 429 });
    }

    // 2. Email Daily Rate Limit (5 per day)
    const emailDailyRateLimit = await checkRateLimit(`resend_daily:${emailLower}`, 5, 86400);
    if (!emailDailyRateLimit.allowed) {
      return NextResponse.json({ 
        error: 'Đạt giới hạn gửi lại mã trong hôm nay (tối đa 5 lần)' 
      }, { status: 429 });
    }

    // 3. Find user
    const usersRef = db.collection('users');
    const userSnapshot = await usersRef.where('email', '==', emailLower).limit(1).get();
    
    if (userSnapshot.empty) {
      return NextResponse.json({ error: 'Tài khoản không tồn tại' }, { status: 404 });
    }

    const userDoc = userSnapshot.docs[0];
    const user = userDoc.data();

    if (user.email_verified) {
      return NextResponse.json({ error: 'Tài khoản đã được xác thực, vui lòng đăng nhập' }, { status: 400 });
    }

    // 4. Find latest OTP session to check cooldown
    const sessionsRef = db.collection('email_otp_sessions');
    const allSessionsSnapshot = await sessionsRef
      .where('email', '==', emailLower)
      .get();

    let resendCount = 1;

    if (!allSessionsSnapshot.empty) {
      // Sort in memory to avoid index requirements
      const docs = allSessionsSnapshot.docs.map(doc => ({ id: doc.id, data: doc.data() }));
      docs.sort((a, b) => b.data.created_at.toMillis() - a.data.created_at.toMillis());
      
      const lastSessionDoc = docs[0];
      const lastSession = lastSessionDoc.data;
      
      // Check 60s cooldown
      const lastSentAt = lastSession.last_sent_at.toDate();
      const now = new Date();
      const diffSeconds = (now.getTime() - lastSentAt.getTime()) / 1000;
      
      if (diffSeconds < 60) {
        return NextResponse.json({ 
          error: `Vui lòng chờ ${Math.ceil(60 - diffSeconds)}s trước khi gửi lại` 
        }, { status: 429 });
      }

      // Invalidate old session
      await sessionsRef.doc(lastSessionDoc.id).update({ invalidated: true });
      
      resendCount = (lastSession.resend_count || 1) + 1;
    }

    // 5. Generate new OTP
    const otp = generateOTP();
    const otpHash = hashOTP(otp);
    const now = new Date();

    // 6. Save new session
    await sessionsRef.add({
      uid: userDoc.id,
      email: emailLower,
      otp_hash: otpHash,
      expires_at: new Date(now.getTime() + 5 * 60 * 1000), // +5 mins
      attempts: 0,
      max_attempts: 5,
      used: false,
      invalidated: false,
      created_at: now,
      last_sent_at: now,
      resend_count: resendCount,
      resend_reset_date: now.toISOString().split('T')[0],
      ip_address: ip
    });

    // 7. Send email
    await sendOTPEmail(emailLower, otp);

    return NextResponse.json({ ok: true, message: 'Đã gửi mã xác thực mới' });

  } catch (err) {
    console.error('Resend OTP error:', err);
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 });
  }
}
