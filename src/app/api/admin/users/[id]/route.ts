import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { isAdminAuthenticated } from '@/lib/auth';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const isAuth = await isAdminAuthenticated(req);
    if (!isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Delete user from users collection
    await db.collection('users').doc(id).delete();

    // Find and delete all licenses associated with this user
    const licensesSnapshot = await db.collection('licenses').where('user_id', '==', id).get();
    const batch = db.batch();
    licensesSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Find and delete all orders associated with this user
    const ordersSnapshot = await db.collection('orders').where('user_id', '==', id).get();
    ordersSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
