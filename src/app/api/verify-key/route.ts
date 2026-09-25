import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { validateKeyFormat, KEY_SCAN_LIMITS } from '@/lib/key-generator';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

export async function POST(req: NextRequest) {
  try {
    // Kiểm tra Extension API secret
    const apiSecret = req.headers.get('x-fh-secret');
    if (apiSecret !== process.env.EXTENSION_API_SECRET) {
      return NextResponse.json({ valid: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { key, machineId } = await req.json();
    if (!key || !machineId) {
      return NextResponse.json({ valid: false, error: 'Thiếu thông tin' }, { status: 400 });
    }

    // Validate format key
    const formatCheck = validateKeyFormat(key.trim().toUpperCase());
    if (!formatCheck.valid) {
      return NextResponse.json({ valid: false, error: 'Key không đúng định dạng' });
    }

    // Tìm key trong DB
    const snap = await db.collection('license_keys')
      .where('key', '==', key.trim().toUpperCase())
      .limit(1)
      .get();

    if (snap.empty) {
      return NextResponse.json({ valid: false, error: 'Key không tồn tại' });
    }

    const docRef = snap.docs[0].ref;
    const data = snap.docs[0].data();

    // Kiểm tra trạng thái
    if (data.status === 'revoked') {
      return NextResponse.json({ valid: false, error: 'Key đã bị thu hồi' });
    }

    // Kiểm tra hết hạn
    if (data.expiresAt) {
      const expiry = (data.expiresAt as Timestamp).toDate();
      if (expiry < new Date()) {
        await docRef.update({ status: 'expired' });
        return NextResponse.json({ valid: false, error: 'Key đã hết hạn' });
      }
    }

    // Kiểm tra machine binding
    const machineIds: string[] = data.machineIds || [];
    if (!machineIds.includes(machineId)) {
      if (machineIds.length >= (data.maxMachines || 1)) {
        return NextResponse.json({
          valid: false,
          error: `Key này đã được dùng trên ${data.maxMachines} thiết bị khác`,
        });
      }
      // Bind máy mới
      await docRef.update({
        machineIds: FieldValue.arrayUnion(machineId),
        lastVerifiedAt: FieldValue.serverTimestamp(),
      });
    } else {
      await docRef.update({ lastVerifiedAt: FieldValue.serverTimestamp() });
    }

    // Trả về thông tin license
    const expiresAt = data.expiresAt ? (data.expiresAt as Timestamp).toDate().toISOString() : null;
    const scanLimit = KEY_SCAN_LIMITS[data.type as keyof typeof KEY_SCAN_LIMITS] ?? -1;

    return NextResponse.json({
      valid: true,
      type: data.type,
      expiresAt,
      scanLimit,
      userName: data.userName,
      userEmail: data.userEmail,
      features: data.type === 'trial' ? ['scan_basic'] : ['scan_basic', 'scan_advanced', 'export'],
    });
  } catch (err) {
    console.error('[/api/verify-key] Error:', err);
    return NextResponse.json({ valid: false, error: 'Lỗi hệ thống' }, { status: 500 });
  }
}
