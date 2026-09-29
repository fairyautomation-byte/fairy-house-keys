import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { isAdminAuthenticated } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    // 1. Chỉ Admin mới được chạy
    const isAuth = await isAdminAuthenticated(req);
    if (!isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 24 hours ago
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);

    let deletedUsers = 0;
    let deletedSessions = 0;

    // 2. Xóa Users chưa xác thực quá 24h
    const usersRef = db.collection('users');
    const oldUnverifiedUsers = await usersRef
      .where('email_verified', '==', false)
      .where('created_at', '<', yesterday)
      .get();

    if (!oldUnverifiedUsers.empty) {
      const batch = db.batch();
      oldUnverifiedUsers.docs.forEach((doc: any) => {
        batch.delete(doc.ref);
        deletedUsers++;
      });
      await batch.commit();
    }

    // 3. Xóa các phiên OTP cũ (dù used hay chưa) quá 24h
    const sessionsRef = db.collection('email_otp_sessions');
    const oldSessions = await sessionsRef
      .where('created_at', '<', yesterday)
      .get();

    if (!oldSessions.empty) {
      // Có thể vượt quá giới hạn 500 của batch nếu nhiều session
      let batchCount = 0;
      let batch = db.batch();
      
      for (const doc of oldSessions.docs) {
        batch.delete(doc.ref);
        deletedSessions++;
        batchCount++;
        
        if (batchCount >= 450) {
          await batch.commit();
          batchCount = 0;
          batch = db.batch();
        }
      }
      
      if (batchCount > 0) {
        await batch.commit();
      }
    }

    return NextResponse.json({
      ok: true,
      deletedUsers,
      deletedSessions,
      message: 'Đã dọn dẹp thành công'
    });

  } catch (err) {
    console.error('Cleanup error:', err);
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 });
  }
}
