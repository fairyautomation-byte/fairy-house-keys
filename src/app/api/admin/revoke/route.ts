import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { isAdminAuthenticated } from '@/lib/auth';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(req: NextRequest) {
  if (!isAdminAuthenticated(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { keyId } = await req.json();
    if (!keyId) return NextResponse.json({ error: 'Thiếu keyId' }, { status: 400 });

    await db.collection('license_keys').doc(keyId).update({
      status: 'revoked',
      revokedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[/api/admin/revoke] Error:', err);
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 });
  }
}
