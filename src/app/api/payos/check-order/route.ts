import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { cookies } from 'next/headers';
import * as admin from 'firebase-admin';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orderCodeStr = searchParams.get('orderCode');

    if (!orderCodeStr) {
      return NextResponse.json({ error: 'Thiếu orderCode' }, { status: 400 });
    }

    const orderCode = parseInt(orderCodeStr);
    if (isNaN(orderCode)) {
      return NextResponse.json({ error: 'orderCode không hợp lệ' }, { status: 400 });
    }

    // Verify session
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 401 });
    }

    let decodedClaims;
    try {
      decodedClaims = await admin.auth().verifySessionCookie(sessionCookie, true);
    } catch (error) {
      return NextResponse.json({ error: 'Phiên đăng nhập không hợp lệ' }, { status: 401 });
    }

    const userId = decodedClaims.uid;

    // Fetch order from Firestore
    const orderQuery = await db.collection('payos_orders').where('orderCode', '==', orderCode).get();
    
    if (orderQuery.empty) {
      return NextResponse.json({ error: 'Không tìm thấy đơn hàng' }, { status: 404 });
    }

    const orderDoc = orderQuery.docs[0];
    const orderData = orderDoc.data();

    // Security Check: Ensure the order belongs to the requesting user
    if (orderData.userId !== userId) {
      return NextResponse.json({ error: 'Không có quyền xem đơn hàng này' }, { status: 403 });
    }

    return NextResponse.json({ 
      status: orderData.status,
      amount: orderData.amount
    });

  } catch (error: any) {
    console.error('Lỗi khi kiểm tra trạng thái đơn hàng:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 });
  }
}
