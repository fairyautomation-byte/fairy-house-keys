import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { sendOTPEmail } from '@/lib/mailer';
import { generateOTP, hashOTP } from '@/lib/otp';
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
      return NextResponse.json({ error: 'Vui lòng nhập email' }, { status: 400 });
    }
    
    const emailLower = email.toLowerCase().trim();

    // 1. Rate Limit (3 requests / minute per IP)
    const ip = getClientIp(req);
    const rateLimit = await checkRateLimit(`forgot_pwd:${ip}`, 3, 60);
    if (!rateLimit.allowed) {
      return NextResponse.json({ 
        error: `Quá nhiều yêu cầu, vui lòng thử lại sau ${rateLimit.retryAfterSeconds}s` 
      }, { status: 429 });
    }

    // 2. Check if user exists and is verified
    const usersRef = db.collection('users');
    const existing = await usersRef.where('email', '==', emailLower).limit(1).get();
    
    if (existing.empty) {
      return NextResponse.json({ error: 'Email không tồn tại trong hệ thống' }, { status: 404 });
    }

    const user = existing.docs[0].data();
    if (!user.email_verified) {
      return NextResponse.json({ error: 'Email này chưa được xác thực, không thể đổi mật khẩu' }, { status: 400 });
    }

    // 3. Generate and store OTP
    const otp = generateOTP();
    const otpHash = hashOTP(otp);
    const now = new Date();
    const userId = existing.docs[0].id;
    
    // Invalidate old OTP sessions
    const oldSessions = await db.collection('email_otp_sessions')
      .where('email', '==', emailLower)
      .where('invalidated', '==', false)
      .get();
      
    if (!oldSessions.empty) {
      const batch = db.batch();
      oldSessions.docs.forEach((doc: any) => {
        batch.update(doc.ref, { invalidated: true });
      });
      await batch.commit();
    }

    await db.collection('email_otp_sessions').add({
      uid: userId,
      email: emailLower,
      otp_hash: otpHash,
      expires_at: new Date(now.getTime() + 5 * 60 * 1000), // +5 mins
      attempts: 0,
      max_attempts: 5,
      used: false,
      invalidated: false,
      created_at: now,
      last_sent_at: now,
      resend_count: 1,
      resend_reset_date: now.toISOString().split('T')[0],
      ip_address: ip
    });

    // 4. Send Emails (await so Vercel doesn't kill it before sending)
    await Promise.allSettled([
      sendOTPEmail(emailLower, otp)
    ]);

    // Mask email for response
    const [name, domain] = emailLower.split('@');
    const maskedEmail = `${name.substring(0, 1)}***@${domain}`;

    return NextResponse.json({ 
      ok: true, 
      email: maskedEmail,
      message: 'Mã xác thực đặt lại mật khẩu đã được gửi'
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 });
  }
}
