interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store (0 database reads, 0 database writes, 100% free)
const memoryStore = new Map<string, RateLimitEntry>();

// Periodically clean up expired entries every 3 minutes
if (typeof setInterval !== 'undefined') {
  const timer = setInterval(() => {
    const now = Date.now();
    memoryStore.forEach((v, k) => {
      if (now > v.resetAt) {
        memoryStore.delete(k);
      }
    });
  }, 3 * 60 * 1000);
  if (timer && typeof timer === 'object' && 'unref' in timer) {
    (timer as any).unref();
  }
}

export async function checkRateLimit(
  key: string,
  maxCount: number,
  windowSeconds: number
): Promise<{ allowed: boolean; retryAfterSeconds?: number }> {
  try {
    const now = Date.now();
    const entry = memoryStore.get(key);

    if (!entry || now > entry.resetAt) {
      memoryStore.set(key, {
        count: 1,
        resetAt: now + windowSeconds * 1000,
      });
      return { allowed: true };
    }

    if (entry.count >= maxCount) {
      const retryAfterSeconds = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
      return { allowed: false, retryAfterSeconds };
    }

    entry.count += 1;
    return { allowed: true };
  } catch (error) {
    console.error(`Rate limit check failed for key ${key}:`, error);
    return { allowed: true };
  }
}

