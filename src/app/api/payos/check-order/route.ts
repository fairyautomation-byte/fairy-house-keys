import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { getAuthenticatedUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
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

    // Verify session using NextRequest
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Không có quyền truy cập hoặc phiên đăng nhập hết hạn' }, { status: 401 });
    }

    const userId = user.uid;

    // Fetch order from Firestore
    const orderQuery = await db.collection('payos_orders').where('payosOrderCode', '==', orderCode).get();
    
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
