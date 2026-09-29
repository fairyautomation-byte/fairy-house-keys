import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { isAdminAuthenticated } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    // 1. Chỉ Admin mới được chạy migration
    const isAuth = await isAdminAuthenticated(req);
    if (!isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { confirm } = await req.json();
    if (confirm !== 'I_KNOW_WHAT_I_AM_DOING') {
      return NextResponse.json({ error: 'Cần xác nhận confirm = I_KNOW_WHAT_I_AM_DOING' }, { status: 400 });
    }

    const usersRef = db.collection('users');
    const snapshot = await usersRef.get();

    let total = 0;
    let verifiedCount = 0;
    let unverifiedCount = 0;

    const batch = db.batch();
    let batchCount = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data();
      total++;

      // Nếu đã có cờ email_verified thì bỏ qua
      if (data.email_verified !== undefined) {
        continue;
      }

      // Điều kiện 1: Đã dùng trial
      // Điều kiện 2: Có license
      // Điều kiện 3: Có order
      const hasTrial = data.trial_used === true;
      
      let hasLicense = false;
      const licensesSnap = await db.collection('licenses').where('user_id', '==', doc.id).limit(1).get();
      if (!licensesSnap.empty) hasLicense = true;

      let hasOrder = false;
      const ordersSnap = await db.collection('orders').where('user_id', '==', doc.id).limit(1).get();
      if (!ordersSnap.empty) hasOrder = true;

      // Quyết định: 
      // Nếu user đã có lịch sử tương tác hợp lệ (trial, license, order), ta tin tưởng và đánh dấu verified.
      // Nếu user chưa làm gì cả (chỉ đăng ký acc rỗng), ta đánh dấu unverified, bắt họ verify lại.
      const shouldVerify = hasTrial || hasLicense || hasOrder;

      batch.update(doc.ref, {
        email_verified: shouldVerify
      });
      
      batchCount++;
      if (shouldVerify) verifiedCount++;
      else unverifiedCount++;

      // Firestore batch limit is 500
      if (batchCount >= 450) {
        await batch.commit();
        batchCount = 0;
      }
    }

    if (batchCount > 0) {
      await batch.commit();
    }

    return NextResponse.json({
      success: true,
      message: 'Migration completed',
      stats: {
        total_scanned: total,
        set_to_verified: verifiedCount,
        set_to_unverified: unverifiedCount,
      }
    });

  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
