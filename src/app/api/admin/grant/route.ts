import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { isAdminAuthenticated } from '@/lib/auth';
import { generateKey, getExpiryDate, KEY_SCAN_LIMITS, KEY_MAX_MACHINES, KeyType } from '@/lib/key-generator';
import { sendKeyToCustomer } from '@/lib/mailer';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(req: NextRequest) {
  if (!isAdminAuthenticated(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { requestId, packageType } = await req.json();
    if (!requestId || !packageType) {
      return NextResponse.json({ error: 'Thiếu thông tin' }, { status: 400 });
    }

    // Lấy thông tin đơn
    const requestDoc = await db.collection('key_requests').doc(requestId).get();
    if (!requestDoc.exists) {
      return NextResponse.json({ error: 'Không tìm thấy đơn' }, { status: 404 });
    }

    const requestData = requestDoc.data()!;
    if (requestData.status === 'granted') {
      return NextResponse.json({ error: 'Đơn này đã được xử lý rồi' }, { status: 409 });
    }

    const type = packageType as KeyType;
    const key = generateKey(type);
    const expiresAt = getExpiryDate(type);

    // Lưu key vào DB
    const keyDocRef = await db.collection('license_keys').add({
      key,
      type,
      userEmail: requestData.email,
      userName: requestData.fullName,
      userZalo: requestData.zalo,
      createdAt: FieldValue.serverTimestamp(),
      expiresAt: expiresAt,
      machineIds: [],
      maxMachines: KEY_MAX_MACHINES[type],
      scanCount: 0,
      scanLimit: KEY_SCAN_LIMITS[type],
      status: 'active',
      requestId,
      lastVerifiedAt: null,
    });

    // Cập nhật trạng thái đơn
    await db.collection('key_requests').doc(requestId).update({
      status: 'granted',
      processedAt: FieldValue.serverTimestamp(),
      grantedKeyId: keyDocRef.id,
      grantedPackage: type,
    });

    // Gửi email cho khách
    await sendKeyToCustomer({
      fullName: requestData.fullName,
      email: requestData.email,
      key,
      packageType: type,
      expiresAt,
    });

    return NextResponse.json({ ok: true, key, keyId: keyDocRef.id });
  } catch (err) {
    console.error('[/api/admin/grant] Error:', err);
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 });
  }
}
