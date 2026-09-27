import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { FieldValue } from 'firebase-admin/firestore';
import { validateKeyFormat } from '@/lib/key-generator';

export async function POST(req: NextRequest) {
  try {
    const { licenseKey } = await req.json();

    if (!licenseKey || !validateKeyFormat(licenseKey).valid) {
      return NextResponse.json({ success: false, code: 'INVALID_LICENSE' }, { status: 400 });
    }

    const licensesRef = db.collection('licenses');
    const snap = await licensesRef.where('license_key', '==', licenseKey).limit(1).get();

    if (snap.empty) {
      return NextResponse.json({ success: false, code: 'LICENSE_NOT_FOUND' }, { status: 404 });
    }

    const licenseDoc = snap.docs[0];
    const licenseRef = licenseDoc.ref;
    const license = licenseDoc.data();

    if (license.status !== 'ACTIVE') {
      return NextResponse.json({ success: false, code: `LICENSE_${license.status}` }, { status: 403 });
    }

    if (license.expires_at) {
      const expiresAt = license.expires_at.toDate ? license.expires_at.toDate() : new Date(license.expires_at);
      if (expiresAt < new Date()) {
        await licenseRef.update({ status: 'EXPIRED' });
        return NextResponse.json({ success: false, code: 'LICENSE_EXPIRED' }, { status: 403 });
      }
    }

    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
    const dailyLimit = license.daily_limit;
    let newDailyUsed = 0;

    try {
      await db.runTransaction(async (transaction: any) => {
        const freshDoc = await transaction.get(licenseRef);
        const freshData = freshDoc.data()!;
        
        let currentUsed = freshData.daily_used || 0;
        
        if (freshData.last_reset_date !== today) {
          currentUsed = 0;
        }

        if (dailyLimit !== -1 && dailyLimit !== null && currentUsed >= dailyLimit) {
          throw new Error('DAILY_LIMIT_REACHED');
        }

        newDailyUsed = currentUsed + 1;

        transaction.update(licenseRef, {
          daily_used: newDailyUsed,
          last_reset_date: today,
          total_scans: FieldValue.increment(1)
        });
      });
    } catch (e: any) {
      if (e.message === 'DAILY_LIMIT_REACHED') {
        return NextResponse.json({
          success: false,
          code: 'DAILY_LIMIT_REACHED',
          daily_limit: dailyLimit,
          daily_used: dailyLimit,
          remaining: 0
        }, { status: 429 });
      }
      throw e;
    }

    return NextResponse.json({
      success: true,
      license_status: 'ACTIVE',
      daily_limit: dailyLimit,
      daily_used: newDailyUsed,
      remaining: (dailyLimit === -1 || dailyLimit === null) ? 'Unlimited' : dailyLimit - newDailyUsed,
      plan: license.plan_id
    });

  } catch (err) {
    console.error('Scan error:', err);
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 });
  }
}
