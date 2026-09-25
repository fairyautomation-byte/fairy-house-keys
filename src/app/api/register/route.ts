import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { sendAdminNotification, sendCustomerConfirmation } from '@/lib/mailer';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fullName, email, zalo, packageType, purpose } = body;

    // Validate
    if (!fullName || !email || !zalo || !packageType) {
      return NextResponse.json({ error: 'Vui lòng điền đầy đủ thông tin' }, { status: 400 });
    }

    const validPackages = ['trial', 'standard', 'pro', 'lifetime'];
    if (!validPackages.includes(packageType)) {
      return NextResponse.json({ error: 'Gói không hợp lệ' }, { status: 400 });
    }

    // Kiểm tra xem email đã có đơn pending chưa
    const existing = await db.collection('key_requests')
      .where('email', '==', email.toLowerCase().trim())
      .where('status', '==', 'pending')
      .limit(1)
      .get();

    if (!existing.empty) {
      return NextResponse.json(
        { error: 'Email này đã có đơn đang chờ xử lý. Vui lòng đợi Admin phản hồi!' },
        { status: 409 }
      );
    }

    // Lưu đơn vào Firestore
    const docRef = await db.collection('key_requests').add({
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      zalo: zalo.trim(),
      packageType,
      purpose: (purpose || '').trim(),
      status: 'pending',
      createdAt: FieldValue.serverTimestamp(),
      processedAt: null,
      grantedKeyId: null,
    });

    // Gửi email song song
    await Promise.allSettled([
      sendAdminNotification({
        fullName: fullName.trim(),
        email: email.toLowerCase().trim(),
        zalo: zalo.trim(),
        packageType,
        purpose: (purpose || '').trim(),
        requestId: docRef.id,
      }),
      sendCustomerConfirmation({
        fullName: fullName.trim(),
        email: email.toLowerCase().trim(),
        packageType,
      }),
    ]);

    return NextResponse.json({ ok: true, requestId: docRef.id });
  } catch (err) {
    console.error('[/api/register] Error:', err);
    return NextResponse.json({ error: 'Lỗi hệ thống, vui lòng thử lại' }, { status: 500 });
  }
}
