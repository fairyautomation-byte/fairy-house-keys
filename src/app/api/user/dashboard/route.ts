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

    // Get current license (if any)
    const licenseSnap = await db.collection('licenses')
      .where('user_id', '==', user.uid)
      .where('status', 'in', ['ACTIVE', 'SUSPENDED'])
      .get();
      
    let activeLicense = null;
    if (!licenseSnap.empty) {
      activeLicense = licenseSnap.docs[0].data();
    }

    // Get pending orders
    const orderSnap = await db.collection('orders')
      .where('user_id', '==', user.uid)
      .get();
    
    const orders = orderSnap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json({
      user: userData,
      license: activeLicense,
      orders: orders
    });
  } catch (err) {
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 });
  }
}
