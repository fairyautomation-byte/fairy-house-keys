import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { isAdminAuthenticated } from '@/lib/auth';

export async function GET(req: NextRequest) {
  if (!isAdminAuthenticated(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'pending';

    let query = db.collection('key_requests').orderBy('createdAt', 'desc');
    if (status !== 'all') {
      query = query.where('status', '==', status) as typeof query;
    }

    const snap = await query.limit(50).get();
    const requests = snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() ?? null,
      processedAt: doc.data().processedAt?.toDate?.()?.toISOString() ?? null,
    }));

    return NextResponse.json({ requests });
  } catch (err) {
    console.error('[/api/admin/requests] Error:', err);
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 });
  }
}
