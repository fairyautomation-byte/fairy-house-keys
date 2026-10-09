import { db } from "./firebase";
import { digest } from "./security";
export async function checkRateLimit(
  key: string,
  maxCount: number,
  windowSeconds: number,
): Promise<{ allowed: boolean; retryAfterSeconds?: number }> {
  const ref = db.collection("rate_limits").doc(digest(key));
  return db.runTransaction(
    async (tx) => {
      const snap = await tx.get(ref);
      const now = Date.now(),
        data = snap.data();
      if (!data || data.resetAt <= now) {
        tx.set(ref, {
          count: 1,
          resetAt: now + windowSeconds * 1000,
          expires_at: new Date(now + windowSeconds * 2000),
        });
        return { allowed: true };
      }
      if (data.count >= maxCount)
        return {
          allowed: false,
          retryAfterSeconds: Math.max(
            1,
            Math.ceil((data.resetAt - now) / 1000),
          ),
        };
      tx.update(ref, { count: data.count + 1 });
      return { allowed: true };
    },
    { maxAttempts: 20 },
  );
}
