import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user details
    const userDoc = await db.collection('users').doc(user.uid).get();
    const userData = userDoc.data();

    // Get current licenses
    const licenseSnap = await db.collection('licenses')
      .where('user_id', '==', user.uid)
      .where('status', 'in', ['ACTIVE', 'SUSPENDED'])
      .get();
      
    const activeLicenses = licenseSnap.docs.map((doc: any) => doc.data());

    // Get pending orders
    const orderSnap = await db.collection('orders')
      .where('user_id', '==', user.uid)
      .get();
    
    const orders = orderSnap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json({
      user: userData,
      licenses: activeLicenses,
      orders: orders
    });
  } catch (err) {
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 });
  }
}
