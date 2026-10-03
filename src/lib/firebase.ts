import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let db: any;
try {
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  }
  db = getFirestore();
} catch (error: any) {
  console.warn('Firebase Admin init warning:', error.message);
  db = {
    collection: () => db,
    orderBy: () => db,
    where: () => db,
    limit: () => db,
    get: async () => ({ docs: [], empty: true, size: 0 }),
    doc: () => db,
    set: async () => {},
    update: async () => {},
    add: async () => {},
    batch: () => ({
      set: () => {},
      update: () => {},
      delete: () => {},
      commit: async () => {},
    }),
    runTransaction: async (fn: any) => {
      const tx = {
        get: async (ref: any) => ({ exists: false, data: () => ({}) }),
        set: () => {},
        update: () => {},
        delete: () => {},
      };
      return await fn(tx);
    },
  };
}

export { db };
