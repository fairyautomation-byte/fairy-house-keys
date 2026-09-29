import { db } from './firebase';
import { Timestamp } from 'firebase-admin/firestore';

export async function checkRateLimit(
  key: string,
  maxCount: number,
  windowSeconds: number
): Promise<{ allowed: boolean; retryAfterSeconds?: number }> {
  const docRef = db.collection('rate_limits').doc(key);

  try {
    return await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(docRef);
      const now = new Date();

      if (!doc.exists) {
        // First time seeing this key
        transaction.set(docRef, {
          count: 1,
          window_start: Timestamp.fromDate(now),
          window_seconds: windowSeconds,
        });
        return { allowed: true };
      }

      const data = doc.data()!;
      const windowStart = (data.window_start as Timestamp).toDate();
      const elapsedSeconds = (now.getTime() - windowStart.getTime()) / 1000;

      if (elapsedSeconds > data.window_seconds) {
        // Window expired, reset counter
        transaction.set(docRef, {
          count: 1,
          window_start: Timestamp.fromDate(now),
          window_seconds: windowSeconds,
        });
        return { allowed: true };
      }

      if (data.count >= maxCount) {
        // Rate limit exceeded
        const retryAfterSeconds = Math.ceil(data.window_seconds - elapsedSeconds);
        return { allowed: false, retryAfterSeconds };
      }

      // Increment counter
      transaction.update(docRef, {
        count: data.count + 1,
      });

      return { allowed: true };
    });
  } catch (error) {
    console.error(`Rate limit check failed for key ${key}:`, error);
    // If rate limiting fails (e.g., Firestore issue), fail open to not block valid users
    return { allowed: true };
  }
}
