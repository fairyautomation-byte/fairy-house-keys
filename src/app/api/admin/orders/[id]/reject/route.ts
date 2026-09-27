import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { isAdminAuthenticated } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const isAuth = await isAdminAuthenticated(req);
    if (!isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orderId = params.id;
    const orderRef = db.collection('orders').doc(orderId);
    
    await orderRef.update({ status: 'REJECTED' });

    return NextResponse.json({ ok: true, message: 'Rejected successfully' });
  } catch (err) {
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 });
  }
}
