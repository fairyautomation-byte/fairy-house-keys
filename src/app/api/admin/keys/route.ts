import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { isAdminAuthenticated } from '@/lib/auth';

export async function GET(req: NextRequest) {
  if (!isAdminAuthenticated(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'all';
    const type = searchParams.get('type') || 'all';

    let query = db.collection('license_keys').orderBy('createdAt', 'desc');
    if (status !== 'all') query = query.where('status', '==', status) as typeof query;
    if (type !== 'all') query = query.where('type', '==', type) as typeof query;

    const snap = await query.limit(100).get();
    const keys = snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() ?? null,
      expiresAt: doc.data().expiresAt?.toDate?.()?.toISOString() ?? null,
      lastVerifiedAt: doc.data().lastVerifiedAt?.toDate?.()?.toISOString() ?? null,
    }));

    return NextResponse.json({ keys });
  } catch (err) {
    console.error('[/api/admin/keys] Error:', err);
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 });
  }
}
