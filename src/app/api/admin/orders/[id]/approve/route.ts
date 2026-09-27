import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { generateKey, KEY_DURATIONS, KEY_SCAN_LIMITS, KeyType } from '@/lib/key-generator';
import { isAdminAuthenticated } from '@/lib/auth';
import { sendKeyToCustomer } from '@/lib/mailer';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const isAuth = await isAdminAuthenticated(req);
    if (!isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orderId = params.id;
    const orderRef = db.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const order = orderDoc.data()!;
    if (order.status !== 'PENDING_PAYMENT_REVIEW') {
      return NextResponse.json({ error: 'Order is not pending review' }, { status: 400 });
    }

    const keyType = order.plan_id as KeyType;
    const licenseKey = generateKey();
    
    const expiresAt = new Date();
    if (KEY_DURATIONS[keyType]) {
      expiresAt.setDate(expiresAt.getDate() + KEY_DURATIONS[keyType]!);
    }

    const newLicense = {
      license_key: licenseKey,
      user_id: order.user_id,
      plan_id: keyType,
      status: 'ACTIVE',
      created_at: new Date(),
      activated_at: new Date(),
      expires_at: KEY_DURATIONS[keyType] ? expiresAt : null,
      daily_limit: KEY_SCAN_LIMITS[keyType],
      daily_used: 0,
      total_scans: 0,
      last_reset_date: new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' })
    };

    // Use batch to ensure atomicity
    const batch = db.batch();
    const licenseRef = db.collection('licenses').doc();
    batch.set(licenseRef, newLicense);
    batch.update(orderRef, { status: 'PAID' });
    
    await batch.commit();

    // Fetch user details to send email
    const userDoc = await db.collection('users').doc(order.user_id).get();
    if (userDoc.exists) {
      const userData = userDoc.data()!;
      sendKeyToCustomer({
        fullName: userData.full_name || 'Khách hàng',
        email: userData.email || '',
        key: licenseKey,
        packageType: keyType,
        expiresAt: KEY_DURATIONS[keyType] ? expiresAt : null
      }).catch(console.error);
    }

    return NextResponse.json({ ok: true, message: 'Approved successfully', licenseKey });
  } catch (err) {
    console.error('Approve order error:', err);
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 });
  }
}
