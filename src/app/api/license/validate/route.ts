import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { validateKeyFormat } from '@/lib/key-generator';

import { checkRateLimit } from '@/lib/rate-limit';

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return 'unknown';
}

// In-memory cache for validated licenses (TTL: 45s) to save Firestore reads
const licenseCache = new Map<string, { data: any; expiry: number }>();

export async function POST(req: NextRequest) {
  try {
    const { licenseKey } = await req.json();

    if (!licenseKey) {
      return NextResponse.json({ error: 'Thiếu License Key' }, { status: 400 });
    }

    const trimmedKey = String(licenseKey).trim().toUpperCase();

    // 1. In-memory Rate limit for validate (60 requests per minute per IP)
    const ip = getClientIp(req);
    const rateLimit = await checkRateLimit(`validate_license:${ip}`, 60, 60);
    if (!rateLimit.allowed) {
      return NextResponse.json({ 
        error: `Quá nhiều yêu cầu, vui lòng thử lại sau`,
        code: 'RATE_LIMIT_EXCEEDED'
      }, { status: 429 });
    }

    // 2. Check memory cache first (0 Firestore reads)
    const now = Date.now();
    const cached = licenseCache.get(trimmedKey);
    if (cached && now < cached.expiry) {
      return NextResponse.json(cached.data);
    }

    if (!validateKeyFormat(trimmedKey).valid) {
      return NextResponse.json({ error: 'INVALID_LICENSE', valid: false }, { status: 400 });
    }

    const licensesRef = db.collection('licenses');
    const snap = await licensesRef.where('license_key', '==', trimmedKey).limit(1).get();

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
        return NextResponse.json({ error: 'LICENSE_EXPIRED', valid: false }, { status: 403 });
      }
    }

    let dailyUsed = license.daily_used || 0;
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
    
    // If new day, count as 0 without performing a costly write in validate
    if (license.last_reset_date !== today) {
      dailyUsed = 0;
    }

    const dailyLimit = license.daily_limit;
    const remaining = dailyLimit === -1 || dailyLimit === null ? 'Unlimited' : dailyLimit - dailyUsed;

    const responsePayload = {
      valid: true,
      license_status: 'ACTIVE',
      plan: license.plan_id,
      expires_at: license.expires_at,
      daily_limit: dailyLimit,
      daily_used: dailyUsed,
      remaining: remaining,
      total_scans: license.total_scans || 0,
    };

    // Cache valid response for 45s
    licenseCache.set(trimmedKey, {
      data: responsePayload,
      expiry: now + 45 * 1000,
    });

    return NextResponse.json(responsePayload);
  } catch (err) {
    console.error('Validate license error:', err);
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 });
  }
}
