import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import nodemailer from 'nodemailer';
import { NextRequest } from 'next/server';
import { db } from '../src/lib/firebase';
import { hashPassword, verifyPassword } from '../src/lib/password';
import { signUserToken, USER_COOKIE_NAME, getAuthenticatedUser } from '../src/lib/auth';
import { validateLicense, vietnamDay } from '../src/lib/license-service';
import { digest } from '../src/lib/security';
import { accountReturnPath } from '../src/lib/auth-redirect';
import { POST as rebind } from '../src/app/api/user/license/rebind/route';
import { POST as invite } from '../src/app/api/license/invite/route';
import { proxy } from '../src/proxy';

const enabled = !!process.env.FIRESTORE_EMULATOR_HOST;
if (enabled && !process.env.FIREBASE_PROJECT_ID?.startsWith('demo-')) throw new Error('Demo project required');
const integration = (name: string, fn: () => Promise<void>) => test(name, { skip: !enabled }, fn);
const suffix = randomUUID(), password = 'Review-password-' + randomUUID();
const messages: any[] = [];
const originalTransport = nodemailer.createTransport;
process.env.JWT_SECRET = randomBytes(32).toString('hex');
process.env.OTP_SECRET_KEY = randomBytes(32).toString('hex');
delete process.env.GMAIL_USER;
delete process.env.GMAIL_APP_PASSWORD;
before(() => {
  // Transport is replaced BEFORE loading registration/order routes. No real SMTP.
  nodemailer.createTransport = (() => ({ sendMail: async (mail: any) => { messages.push(mail); return { accepted: [mail.to] }; } })) as any;
});
after(async () => { nodemailer.createTransport = originalTransport; if (enabled) await db.terminate(); });
function request(path: string, body: any, token?: string, extra: Record<string, string> = {}) {
  return new NextRequest('http://localhost' + path, { method: 'POST', headers: {
    'content-type': 'application/json', origin: 'http://localhost', 'x-forwarded-for': suffix,
    ...(token ? { authorization: `Bearer ${token}` } : {}), ...extra,
  }, body: JSON.stringify(body) });
}
async function seed(name: string) {
  const user = db.collection('users').doc(`${suffix}-${name}`);
  const email = `${suffix}-${name}@example.test`;
  await user.set({ email, password: await hashPassword(password), email_verified: true, auth_version: 0, status: 'ACTIVE', wallet_balance: 200000 });
  const license = db.collection('licenses').doc(user.id);
  const key = 'FHAD-' + randomBytes(8).toString('hex').toUpperCase().match(/.{4}/g)!.join('-');
  await license.set({ license_key: key, user_id: user.id, status: 'ACTIVE', daily_limit: 100, daily_used: 0, total_scans: 0,
    installation_id: 'installation-old', last_reset_date: vietnamDay() });
  return { user, email, license, key, token: await signUserToken(user.id, email, 0) };
}

test('return paths preserve reinstall intent and reject external redirects', () => {
  assert.equal(accountReturnPath('/dashboard/licenses?installationId=new-install'), '/dashboard/licenses?installationId=new-install');
  for (const value of ['//evil.test', 'https://evil.test', '/\\evil.test', '/login', '/dashboard/../../evil']) assert.equal(accountReturnPath(value), null);
});

integration('reinstall: owner/password required; atomic new binding revokes old installation', async () => {
  const owner = await seed('owner'), stranger = await seed('stranger');
  const body = { licenseId: owner.license.id, installationId: 'installation-new', password };
  assert.equal((await rebind(request('/api/user/license/rebind', body))).status, 401);
  assert.equal((await rebind(request('/api/user/license/rebind', body, stranger.token))).status, 403);
  assert.equal((await rebind(request('/api/user/license/rebind', { ...body, password: 'wrong-password' }, owner.token))).status, 403);
  assert.equal((await rebind(request('/api/user/license/rebind', body, owner.token, { origin: 'https://evil.test' }))).status, 403);
  assert.equal((await rebind(request('/api/user/license/rebind', body, owner.token))).status, 200);
  assert.equal((await validateLicense(owner.license, 'installation-new'))!.valid, true);
  await assert.rejects(validateLicense(owner.license, 'installation-old'), (e: any) => e.code === 'DEVICE_LIMIT_EXCEEDED');
  const events = await db.collection('license_events').where('license_id', '==', owner.license.id).get();
  assert.equal(events.size, 1);
});

integration('invite: past 100 is unlimited, retries dedupe and wrong/revoked installation denied', async () => {
  const owner = await seed('invite');
  const counter = db.collection('invite_usage').doc(digest(`${owner.user.id}:${vietnamDay()}`));
  await counter.set({ used: 1000 });
  const body = { licenseKey: owner.key, installationId: 'installation-old', requestId: 'invite-' + randomUUID(), action: 'consume' };
  for (let i = 0; i < 2; i++) {
    const response = await invite(request('/api/license/invite', body));
    assert.equal(response.status, 200);
    assert.deepEqual((await response.json()).data, { allowed: true, blocked: false, unlimited: true, remaining: null });
  }
  assert.equal((await counter.get()).data()!.used, 1001);
  assert.equal((await invite(request('/api/license/invite', { ...body, installationId: 'foreign-install' }))).status, 403);
  await owner.license.update({ status: 'REVOKED' });
  assert.equal((await invite(request('/api/license/invite', body))).status, 403);
});

integration('account funnel: signup, prevent pending password overwrite, OTP, login, dashboard, logout', async () => {
  const { POST: register } = await import('../src/app/api/auth/register/route');
  const { POST: verify } = await import('../src/app/api/auth/verify-otp/route');
  const { POST: login } = await import('../src/app/api/auth/login/route');
  const { POST: logout } = await import('../src/app/api/auth/logout/route');
  const { GET: dashboard } = await import('../src/app/api/user/dashboard/route');
  const email = `${suffix}-signup@example.test`;
  const form = { fullName: 'Local Review', email, password };
  assert.equal((await register(request('/api/auth/register', form))).status, 200);
  const otp = messages.find(mail => mail.to === email)?.html.match(/>\s*(\d{6})\s*</)?.[1];
  assert.ok(otp, 'capture OTP only through fake SMTP');
  const pendingLogin = await login(request('/api/auth/login', { email, password }));
  assert.equal(pendingLogin.status, 403);
  assert.equal((await pendingLogin.json()).code, 'EMAIL_NOT_VERIFIED');
  const replacement = await register(request('/api/auth/register', { ...form, password: 'Attacker-password-123' }));
  assert.equal(replacement.status, 409);
  const user = (await db.collection('users').where('email', '==', email).get()).docs[0];
  assert.equal(await verifyPassword(password, user.data().password), true);
  const verified = await verify(request('/api/auth/verify-otp', { email, otp }));
  assert.equal(verified.status, 200);
  assert.ok(verified.cookies.get(USER_COOKIE_NAME)?.value);
  assert.equal((await verify(request('/api/auth/verify-otp', { email, otp }))).status, 400);
  assert.equal((await login(request('/api/auth/login', { email, password: 'incorrect' }))).status, 401);
  const logged = await login(request('/api/auth/login', { email, password }));
  assert.equal(logged.status, 200);
  const cookie = `${USER_COOKIE_NAME}=${logged.cookies.get(USER_COOKIE_NAME)!.value}`;
  const get = () => new NextRequest('http://localhost/api/user/dashboard', { headers: { cookie } });
  assert.equal((await dashboard(get())).status, 200);
  assert.equal((await logout(request('/api/auth/logout', {}, undefined, { cookie }))).status, 200);
  assert.equal((await dashboard(get())).status, 401);
  assert.equal(await getAuthenticatedUser(get()), null);
});

integration('login return preserves reinstall URL and revoked JWT cannot trap user away from login', async () => {
  const path = '/dashboard/licenses?installationId=installation-new';
  const redirect = await proxy(new NextRequest('http://localhost' + path));
  assert.equal(new URL(redirect.headers.get('location')!).searchParams.get('next'), path);
  const account = await seed('revoked');
  await account.user.update({ auth_version: 1 });
  const login = await proxy(new NextRequest('http://localhost/login', { headers: { cookie: `${USER_COOKIE_NAME}=${account.token}` } }));
  assert.equal(login.headers.get('location'), null);
});

integration('purchase: wallet retry, trial twice, PayOS price authority, mismatch and duplicate webhook', async () => {
  const { POST: wallet } = await import('../src/app/api/orders/pay-with-wallet/route');
  const { POST: trial } = await import('../src/app/api/orders/submit/route');
  const { POST: create } = await import('../src/app/api/payos/create-payment-link/route');
  const { POST: webhook } = await import('../src/app/api/payos/webhook/route');
  const { setPayosClient } = await import('../src/lib/payos');
  const owner = await seed('purchase');
  for (const id of ['trial', 'monthly']) await db.collection('plans').doc(id).set({ price: id === 'trial' ? 0 : 69000, duration: 3, scanLimit: 100, active: true });
  const buy = { planId: 'monthly', requestId: 'wallet-' + randomUUID() };
  const first = await wallet(request('/api/orders/pay-with-wallet', buy, owner.token));
  const second = await wallet(request('/api/orders/pay-with-wallet', buy, owner.token));
  assert.equal(first.status, 200); assert.equal(second.status, 200);
  assert.equal((await first.json()).licenseKey, (await second.json()).licenseKey);
  assert.equal((await owner.user.get()).data()!.wallet_balance, 131000);
  const trialFirst = await trial(request('/api/orders/submit', { planId: 'trial' }, owner.token));
  const trialSecond = await trial(request('/api/orders/submit', { planId: 'trial' }, owner.token));
  assert.equal(trialFirst.status, 200); assert.equal(trialSecond.status, 200);
  assert.equal((await trialFirst.json()).licenseKey, (await trialSecond.json()).licenseKey);
  let created: any;
  setPayosClient({ createPaymentLink: async (data: any) => {
    created = data; return { ...data, bin: 'TEST', accountNumber: 'TEST', accountName: 'TEST', qrCode: 'fixture', checkoutUrl: 'https://example.test/pay' };
  }, verifyPaymentWebhookData: (body: any) => { if (body.signature !== 'fixture-valid') throw new Error('invalid fixture signature'); return body.data; } } as any);
  try {
    const response = await create(request('/api/payos/create-payment-link', { planId: 'monthly', amount: 1, requestId: 'payos-' + randomUUID() }, owner.token));
    assert.equal(response.status, 200); assert.equal(created.amount, 69000);
    const body = { signature: 'fixture-valid', data: { code: '00', orderCode: created.orderCode, amount: 69000, reference: randomUUID() } };
    assert.equal((await webhook(request('/api/payos/webhook', { ...body, signature: 'invalid' }))).status, 400);
    const wrong = await webhook(request('/api/payos/webhook', { ...body, data: { ...body.data, amount: 1 } }));
    assert.ok(wrong.status >= 400);
    for (let i = 0; i < 2; i++) assert.equal((await webhook(request('/api/payos/webhook', body))).status, 200);
    assert.equal((await db.collection('licenses').doc(`payos_${created.orderCode}`).get()).exists, true);
    assert.equal((await owner.user.get()).data()!.wallet_balance, 131000);
  } finally { setPayosClient(undefined); }
});
