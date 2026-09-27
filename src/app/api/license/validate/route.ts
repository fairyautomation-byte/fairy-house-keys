import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { validateKeyFormat } from '@/lib/key-generator';

export async function POST(req: NextRequest) {
  try {
    const { licenseKey } = await req.json();

    if (!licenseKey) {
      return NextResponse.json({ error: 'Thiếu License Key' }, { status: 400 });
    }

    if (!validateKeyFormat(licenseKey).valid) {
      return NextResponse.json({ error: 'INVALID_LICENSE', valid: false }, { status: 400 });
    }

    const licensesRef = db.collection('licenses');
    const snap = await licensesRef.where('license_key', '==', licenseKey).limit(1).get();

    if (snap.empty) {
      return NextResponse.json({ error: 'LICENSE_NOT_FOUND', valid: false }, { status: 404 });
    }

    const licenseDoc = snap.docs[0];
    const license = licenseDoc.data();

    if (license.status !== 'ACTIVE') {
      return NextResponse.json({ error: `LICENSE_${license.status}`, valid: false }, { status: 403 });
    }

    if (license.expires_at) {
      const expiresAt = license.expires_at.toDate ? license.expires_at.toDate() : new Date(license.expires_at);
      if (expiresAt < new Date()) {
        await licenseDoc.ref.update({ status: 'EXPIRED' });
        return NextResponse.json({ error: 'LICENSE_EXPIRED', valid: false }, { status: 403 });
      }
    }

    let dailyUsed = license.daily_used || 0;
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
    
    if (license.last_reset_date !== today) {
      dailyUsed = 0;
    }

    const dailyLimit = license.daily_limit;
    const remaining = dailyLimit === -1 || dailyLimit === null ? 'Unlimited' : dailyLimit - dailyUsed;

    return NextResponse.json({
      valid: true,
      license_status: 'ACTIVE',
      plan: license.plan_id,
      expires_at: license.expires_at,
      daily_limit: dailyLimit,
      daily_used: dailyUsed,
      remaining: remaining,
    });
  } catch (err) {
    console.error('Validate license error:', err);
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 });
  }
}
