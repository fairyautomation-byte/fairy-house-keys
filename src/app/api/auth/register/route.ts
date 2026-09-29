import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { sendNewUserWelcome, sendNewUserAdminNotification, sendOTPEmail } from '@/lib/mailer';
import { generateOTP, hashOTP } from '@/lib/otp';
import { checkRateLimit } from '@/lib/rate-limit';
import * as crypto from 'crypto';

function hashPassword(password: string) {
  return crypto.createHash('sha256').update(password + (process.env.KEY_SECRET_SALT || 'salt')).digest('hex');
}

function getClientIp(req: NextRequest): string {
  // Use headers to get real IP in Vercel
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return 'unknown';
}

export async function POST(req: NextRequest) {
  try {
    const { fullName, email, password, zalo, _hp } = await req.json();

    // 1. Honeypot check
    if (_hp) {
      // Bot filled honeypot, fail silently
      return NextResponse.json({ error: 'Lỗi xác thực' }, { status: 400 });
    }

    if (!fullName || !email || !password) {
      return NextResponse.json({ error: 'Vui lòng điền đủ thông tin' }, { status: 400 });
    }
    
    const emailLower = email.toLowerCase().trim();

    // 2. Rate Limit (3 requests / minute per IP)
    const ip = getClientIp(req);
    const rateLimit = await checkRateLimit(`register:${ip}`, 3, 60);
    if (!rateLimit.allowed) {
      return NextResponse.json({ 
        error: `Quá nhiều yêu cầu, vui lòng thử lại sau ${rateLimit.retryAfterSeconds}s` 
      }, { status: 429 });
    }

    // 3. Check if user exists
    const usersRef = db.collection('users');
    const existing = await usersRef.where('email', '==', emailLower).limit(1).get();
    
    let userIdToUpdate = null;
    if (!existing.empty) {
      const existingUser = existing.docs[0].data();
      if (existingUser.email_verified) {
        return NextResponse.json({ error: 'Email đã được sử dụng' }, { status: 409 });
      } else {
        // Email exists but unverified, allow overwrite to prevent squatting
        userIdToUpdate = existing.docs[0].id;
      }
    }

    // 4. Hash password
    const hashedPassword = hashPassword(password);
    
    // 5. Create or Update user (email_verified: false)
    const newUser = {
      full_name: fullName.trim(),
      email: emailLower,
      zalo: (zalo || '').trim(),
      password: hashedPassword,
      role: 'USER',
      trial_used: false,
      created_at: new Date(),
      email_verified: false,
    };

    let docRefId;
    if (userIdToUpdate) {
      await usersRef.doc(userIdToUpdate).set(newUser);
      docRefId = userIdToUpdate;
      
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
    } else {
      const docRef = await usersRef.add(newUser);
      docRefId = docRef.id;
    }
    
    // 6. Generate and store OTP
    const otp = generateOTP();
    const otpHash = hashOTP(otp);
    const now = new Date();
    
    await db.collection('email_otp_sessions').add({
      uid: docRefId,
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

    // 7. Send Emails (await so Vercel doesn't kill it before sending)
    const emailResults = await Promise.allSettled([
      sendOTPEmail(emailLower, otp)
    ]);

    emailResults.forEach((res, index) => {
      if (res.status === 'rejected') {
        console.error(`Register email send failed for index ${index}:`, res.reason);
      }
    });

    // Mask email for response
    const [name, domain] = emailLower.split('@');
    const maskedEmail = `${name.substring(0, 1)}***@${domain}`;

    // Note: No JWT token issued here anymore
    
    return NextResponse.json({ 
      ok: true, 
      email: maskedEmail,
      fullEmail: emailLower, // needed for frontend redirect
      message: 'Mã xác thực đã được gửi đến email của bạn'
    });
  } catch (err) {
    console.error('Register error:', err);
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 });
  }
}
