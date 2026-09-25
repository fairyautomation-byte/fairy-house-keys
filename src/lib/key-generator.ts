import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';

export type KeyType = 'trial' | 'standard' | 'pro' | 'lifetime';

const KEY_PREFIXES: Record<KeyType, string> = {
  trial: 'FH-TRIAL',
  standard: 'FH-STD',
  pro: 'FH-PRO',
  lifetime: 'FH-LIFE',
};

// Số ngày cho mỗi gói (null = vĩnh viễn)
export const KEY_DURATIONS: Record<KeyType, number | null> = {
  trial: 1,
  standard: 30,
  pro: 90,
  lifetime: null,
};

// Giới hạn scan mỗi ngày (-1 = không giới hạn)
export const KEY_SCAN_LIMITS: Record<KeyType, number> = {
  trial: 50,
  standard: 500,
  pro: -1,
  lifetime: -1,
};

// Số máy tối đa được bind
export const KEY_MAX_MACHINES: Record<KeyType, number> = {
  trial: 1,
  standard: 1,
  pro: 2,
  lifetime: 3,
};

function generateRandomPart(length: number): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}

function generateChecksum(type: string, random: string): string {
  const salt = process.env.KEY_SECRET_SALT || 'fh-default-salt';
  const hash = crypto.createHash('sha256').update(`${type}${random}${salt}`).digest('hex');
  return hash.substring(0, 4).toUpperCase();
}

export function generateKey(type: KeyType): string {
  const prefix = KEY_PREFIXES[type];
  const random = generateRandomPart(16);
  const checksum = generateChecksum(type, random);
  return `${prefix}-${random}-${checksum}`;
}

export function validateKeyFormat(key: string): { valid: boolean; type?: KeyType } {
  const patterns: Array<{ regex: RegExp; type: KeyType }> = [
    { regex: /^FH-TRIAL-([A-Z0-9]{16})-([A-Z0-9]{4})$/, type: 'trial' },
    { regex: /^FH-STD-([A-Z0-9]{16})-([A-Z0-9]{4})$/, type: 'standard' },
    { regex: /^FH-PRO-([A-Z0-9]{16})-([A-Z0-9]{4})$/, type: 'pro' },
    { regex: /^FH-LIFE-([A-Z0-9]{16})-([A-Z0-9]{4})$/, type: 'lifetime' },
  ];

  for (const { regex, type } of patterns) {
    const match = key.match(regex);
    if (match) {
      const random = match[1];
      const checksum = match[2];
      const expectedChecksum = generateChecksum(type, random);
      if (checksum === expectedChecksum) {
        return { valid: true, type };
      }
    }
  }
  return { valid: false };
}

export function getExpiryDate(type: KeyType): Date | null {
  const days = KEY_DURATIONS[type];
  if (days === null) return null;
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}
