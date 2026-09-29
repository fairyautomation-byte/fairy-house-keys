import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { getAuthenticatedUser } from '@/lib/auth';
import { generateKey, KEY_DURATIONS, KEY_SCAN_LIMITS, KEY_PRICES, KeyType } from '@/lib/key-generator';
import { sendAdminNotification, sendCustomerConfirmation, sendKeyToCustomer } from '@/lib/mailer';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập' }, { status: 401 });
    }

    const { planId } = await req.json();
    if (!['trial', 'monthly', 'quarterly', 'yearly'].includes(planId)) {
      return NextResponse.json({ error: 'Gói không hợp lệ' }, { status: 400 });
    }
    
    const keyType = planId as KeyType;

    const userRef = db.collection('users').doc(user.uid);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data()!;

    if (!userData.email_verified) {
      return NextResponse.json({ 
        error: 'Vui lòng xác thực email trước khi đăng ký gói',
        code: 'EMAIL_NOT_VERIFIED' 
      }, { status: 403 });
    }

    if (keyType === 'trial') {
      if (userData.trial_used) {
        return NextResponse.json({ error: 'TRIAL_ALREADY_USED' }, { status: 403 });
      }

      // Auto create trial license
      const licenseKey = generateKey();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + (KEY_DURATIONS.trial || 3));

      const newLicense = {
        license_key: licenseKey,
        user_id: user.uid,
        plan_id: 'trial',
        status: 'ACTIVE',
        created_at: new Date(),
        activated_at: new Date(),
        expires_at: expiresAt,
        daily_limit: KEY_SCAN_LIMITS.trial,
        daily_used: 0,
        total_scans: 0,
        last_reset_date: new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }) // YYYY-MM-DD
      };

      await db.collection('licenses').add(newLicense);
      await userRef.update({ trial_used: true });

      // Gửi email cho khách (trial cấp ngay) - await
      try {
        await sendKeyToCustomer({
          fullName: userData.full_name || 'Khách hàng',
          email: user.email || userData.email || '',
          key: licenseKey,
          packageType: 'trial',
          expiresAt: expiresAt
        });
      } catch (err) {
        console.error('Email send failed:', err);
      }

      return NextResponse.json({ ok: true, message: 'Kích hoạt Trial thành công' });
    } else {
      // Create Order for Paid plan
      const now = new Date();
      // Generate transaction code FH20260927XXXX
      const dateStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).replace(/-/g, '');
      const random4 = Math.floor(1000 + Math.random() * 9000);
      const transactionCode = `FH${dateStr}${random4}`;

      const newOrder = {
        transaction_code: transactionCode,
        user_id: user.uid,
        plan_id: keyType,
        amount: KEY_PRICES[keyType],
        status: 'PENDING_PAYMENT_REVIEW',
        created_at: now,
      };

      const orderRef = await db.collection('orders').add(newOrder);

      // Gửi email thông báo (await)
      const emailResults = await Promise.allSettled([
        sendAdminNotification({
          fullName: userData.full_name || 'Khách hàng',
          email: user.email || userData.email || '',
          zalo: userData.zalo || '',
          packageType: keyType,
          purpose: 'Mua từ hệ thống mới',
          requestId: orderRef.id
        }),
        sendCustomerConfirmation({
          fullName: userData.full_name || 'Khách hàng',
          email: user.email || userData.email || '',
          packageType: keyType
        })
      ]);

      emailResults.forEach((res, index) => {
        if (res.status === 'rejected') {
          console.error(`Order email send failed for index ${index}:`, res.reason);
        }
      });

      return NextResponse.json({ 
        ok: true, 
        orderId: orderRef.id, 
        transactionCode, 
        amount: KEY_PRICES[keyType] 
      });
    }
  } catch (err) {
    console.error('Order submit error:', err);
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 });
  }
}
