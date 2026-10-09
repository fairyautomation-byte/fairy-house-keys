// In-memory cache for validated licenses (TTL: 30s) to save Firestore reads
export interface CachedLicense {
  data: any;
  expiry: number;
}

export const licenseCache = new Map<string, CachedLicense>();

export function invalidateLicenseCache(key: string) {
  if (!key) return;
  licenseCache.delete(String(key).trim().toUpperCase());
}
