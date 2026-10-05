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
    if (!userDoc.exists) {
      const response = NextResponse.json({ error: 'User not found' }, { status: 401 });
      response.cookies.delete('FairyHouse_Session');
      return response;
    }
    const userData = userDoc.data();
    if (userData && userData.password) {
      delete userData.password;
    }

    // Real-time Vietnam Date YYYY-MM-DD
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });

    // Get current licenses
    const licenseSnap = await db.collection('licenses')
      .where('user_id', '==', user.uid)
      .where('status', 'in', ['ACTIVE', 'SUSPENDED'])
      .get();
      
    const activeLicenses = await Promise.all(
      licenseSnap.docs.map(async (doc: any) => {
        const data = doc.data();
        const docId = doc.id;

        // Auto-reset daily quota if it's a new calendar day in Vietnam (00:00 VN)
        if (data.last_reset_date !== today) {
          doc.ref.update({
            daily_used: 0,
            last_reset_date: today,
          }).catch((err: any) => console.error('Error auto-resetting quota in dashboard:', err));

          return {
            id: docId,
            ...data,
            daily_used: 0,
            last_reset_date: today,
          };
        }

        return {
          id: docId,
          ...data,
        };
      })
    );

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
