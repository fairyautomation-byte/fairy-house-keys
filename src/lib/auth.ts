import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-this';
const COOKIE_NAME = 'fh_admin_token';

export function signAdminToken(): string {
  return `${JWT_SECRET}-admin-token-secure`;
}

export function verifyAdminToken(token: string): boolean {
  return token === `${JWT_SECRET}-admin-token-secure`;
}

export function getAdminTokenFromRequest(req: NextRequest): string | null {
  // Check cookie
  const cookie = req.cookies.get(COOKIE_NAME)?.value;
  if (cookie) return cookie;
  // Check Authorization header
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7);
  return null;
}

export function isAdminAuthenticated(req: NextRequest): boolean {
  const token = getAdminTokenFromRequest(req);
  if (!token) return false;
  return verifyAdminToken(token);
}

export function validateAdminCredentials(username: string, password: string): boolean {
  const validUsername = process.env.ADMIN_USERNAME || 'admin';
  const validPassword = process.env.ADMIN_PASSWORD || 'fairy_house_admin';
  return username === validUsername && password === validPassword;
}

export { COOKIE_NAME };
