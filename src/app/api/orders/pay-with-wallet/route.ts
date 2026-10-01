import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { getAuthenticatedUser } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { generateKey, KeyType } from '@/lib/key-generator';
import { sendKeyToCustomer } from '@/lib/mailer';

export async function POST(req: NextRequest) {
  try {
    // 1. Kiểm tra xác thực (Bắt buộc)
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Kiểm tra chống Spam (Rate Limit) - 5 yêu cầu/phút
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
    const rateLimit = await checkRateLimit(`buy_wallet:${user.uid}_${ip}`, 5, 60);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Thao tác quá nhanh, vui lòng thử lại sau.' }, { status: 429 });
    }

    const { planId } = await req.json();
    if (!['trial', 'monthly', 'quarterly', 'yearly'].includes(planId)) {
      return NextResponse.json({ error: 'Gói dịch vụ không hợp lệ' }, { status: 400 });
    }

    const keyType = planId as KeyType;
    
    // Đọc thông tin gói cước từ Firebase thay vì gắn cứng (Hacker mindset)
    const planDoc = await db.collection('plans').doc(keyType).get();
    if (!planDoc.exists) {
      return NextResponse.json({ error: 'Gói cước không tồn tại' }, { status: 400 });
    }
    const planData = planDoc.data()!;
    if (planData.active === false) {
      return NextResponse.json({ error: 'Gói cước đã ngừng bán' }, { status: 400 });
    }
    
    const price = planData.price;
    const durationDays = planData.duration; // nullable
    const scanLimit = planData.scanLimit;

    const userRef = db.collection('users').doc(user.uid);

    let licenseKey = '';
    let transactionCodeStr = '';

    // 3. Thực hiện giao dịch Nguyên tử (Atomic Transaction) để chống gian lận đa luồng
    await db.runTransaction(async (tx: any) => {
      const userDoc = await tx.get(userRef);
      if (!userDoc.exists) {
        throw new Error('User not found');
      }

      const userData = userDoc.data()!;
      const currentBalance = userData.wallet_balance || 0;

      // 3.1. Kiểm tra điều kiện mua (số dư, trial_used)
      if (keyType === 'trial') {
        if (userData.trial_used) {
          throw new Error('TRIAL_ALREADY_USED');
        }
      } else if (currentBalance < price) {
        throw new Error('INSUFFICIENT_FUNDS');
      }

      // 3.2. Trừ tiền (và đánh dấu trial_used nếu là gói trial)
      const updates: any = {};
      if (keyType === 'trial') {
        updates.trial_used = true;
      } else {
        updates.wallet_balance = currentBalance - price;
      }
      tx.update(userRef, updates);

      // 3.3. Tạo License Key
      licenseKey = generateKey();
      const expiresAt = new Date();
      if (durationDays !== null) {
        expiresAt.setDate(expiresAt.getDate() + durationDays);
      }

      const newLicense = {
        license_key: licenseKey,
        user_id: user.uid,
        plan_id: keyType,
        status: 'ACTIVE',
        created_at: new Date(),
        activated_at: new Date(),
        expires_at: durationDays !== null ? expiresAt : null,
        daily_limit: scanLimit,
        daily_used: 0,
        total_scans: 0,
        last_reset_date: new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' })
      };
      const licenseRef = db.collection('licenses').doc();
      tx.set(licenseRef, newLicense);

      // 3.4. Ghi nhận lịch sử Order
      const dateStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).replace(/-/g, '');
      const random4 = Math.floor(1000 + Math.random() * 9000);
      transactionCodeStr = `FH${dateStr}${random4}`;

      const newOrder = {
        transaction_code: transactionCodeStr,
        user_id: user.uid,
        plan_id: keyType,
        amount: price,
        status: 'PAID', // Thanh toán thành công luôn
        payment_method: 'WALLET',
        created_at: new Date(),
      };
      const orderRef = db.collection('orders').doc();
      tx.set(orderRef, newOrder);
    });

    // 4. Lấy lại thông tin user để gửi Email (Không cho vào transaction để tránh kẹt nếu gửi mail lâu)
    const finalUserDoc = await userRef.get();
    const finalUserData = finalUserDoc.data()!;
    const expiresAtFinal = new Date();
    if (durationDays !== null) {
      expiresAtFinal.setDate(expiresAtFinal.getDate() + durationDays);
    }

    try {
      await sendKeyToCustomer({
        fullName: finalUserData.full_name || 'Khách hàng',
        email: user.email || finalUserData.email || '',
        key: licenseKey,
        packageType: keyType,
        expiresAt: durationDays !== null ? expiresAtFinal : null
      });
    } catch (err) {
      console.error('Email send failed:', err);
    }

    return NextResponse.json({ ok: true, message: 'Mua thành công', licenseKey, newBalance: finalUserData.wallet_balance });

  } catch (err: any) {
    console.error('Pay with wallet error:', err);
    if (err.message === 'INSUFFICIENT_FUNDS') {
      return NextResponse.json({ error: 'Số dư không đủ, vui lòng nạp thêm.' }, { status: 400 });
    }
    if (err.message === 'TRIAL_ALREADY_USED') {
      return NextResponse.json({ error: 'Mỗi tài khoản chỉ được đăng ký gói Dùng thử 1 lần duy nhất.' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 });
  }
}
