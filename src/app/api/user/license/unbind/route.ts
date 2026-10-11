import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { getAuthenticatedUser } from '@/lib/auth';
import { verifyPassword } from '@/lib/password';
import { licenseView } from '@/lib/license-service';
import { ApiError, activeUser, failure, jsonBody, sameOrigin } from '@/lib/security';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    if (!sameOrigin(req)) throw new ApiError(403, 'ORIGIN_DENIED');
    const user = await getAuthenticatedUser(req);
    if (!user) throw new ApiError(401, 'Unauthorized');
    if (!(await checkRateLimit(`unbind:${user.uid}`, 5, 600)).allowed)
      throw new ApiError(429, 'RATE_LIMIT_EXCEEDED');
    const { licenseId, password } = await jsonBody(req);
    if (typeof licenseId !== 'string' || !licenseId || licenseId.length > 1500 || licenseId.includes('/') ||
        typeof password !== 'string' || !password || password.length > 1024)
      throw new ApiError(400, 'INVALID_INPUT');
    const ownerRef = db.collection('users').doc(user.uid);
    const account = (await ownerRef.get()).data();
    if (!account || !(await verifyPassword(password, account.password)))
      throw new ApiError(403, 'PASSWORD_INCORRECT', 'Mật khẩu tài khoản không đúng.');
    const ref = db.collection('licenses').doc(licenseId);
    const audit = db.collection('license_events').doc();
    await db.runTransaction(async tx => {
      const [license, freshOwner] = await Promise.all([tx.get(ref), tx.get(ownerRef)]);
      const data = license.data(), owner = freshOwner.data();
      if (!owner || !activeUser(owner) || owner.email_verified !== true ||
          owner.password !== account.password || (owner.auth_version || 0) !== (account.auth_version || 0))
        throw new ApiError(401, 'SESSION_CHANGED');
      if (!data || data.user_id !== user.uid) throw new ApiError(403, 'LICENSE_OWNER_REQUIRED');
      if (!licenseView(data).valid) throw new ApiError(403, 'LICENSE_DENIED');
      
      tx.update(ref, {
        installation_id: null,
        installation_name: null,
        installation_bound_at: null,
        last_unbound_at: new Date(),
      });
      tx.set(audit, { action: 'OWNER_UNBIND', user_id: user.uid, license_id: ref.id, created_at: new Date() });
    });
    return NextResponse.json({ ok: true, unbound: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return failure(error, req); }
}
