import { NextRequest } from 'next/server';
import { verifyToken, signToken } from './jwt';

export const ADMIN_COOKIE_NAME = 'fh_admin_token';
export const USER_COOKIE_NAME = 'fh_user_token';

// ==== ADMIN AUTH ====
export async function signAdminToken(): Promise<string> {
  return signToken({ role: 'admin' }, '1d');
}

export async function getAdminTokenFromRequest(req: NextRequest): Promise<string | null> {
  const cookie = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (cookie) return cookie;
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7);
  return null;
}

export async function isAdminAuthenticated(req: NextRequest): Promise<boolean> {
  const token = await getAdminTokenFromRequest(req);
  if (!token) return false;
  const payload = await verifyToken(token);
  return payload?.role === 'admin';
}

export function validateAdminCredentials(username: string, password: string): boolean {
  const validUsername = process.env.ADMIN_USERNAME || 'admin';
  const validPassword = process.env.ADMIN_PASSWORD || 'fairy_house_admin_2026!';
  return username === validUsername && password === validPassword;
}

// ==== USER AUTH ====
export async function signUserToken(uid: string, email: string): Promise<string> {
  return signToken({ role: 'user', uid, email }, '7d');
}

export async function getUserTokenFromRequest(req: NextRequest): Promise<string | null> {
  const cookie = req.cookies.get(USER_COOKIE_NAME)?.value;
  if (cookie) return cookie;
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7);
  return null;
}

export async function getAuthenticatedUser(req: NextRequest): Promise<{ uid: string, email: string } | null> {
  const token = await getUserTokenFromRequest(req);
  if (!token) return null;
  const payload = await verifyToken(token);
  if (payload && payload.role === 'user') {
    return { uid: payload.uid, email: payload.email };
  }
  return null;
}
