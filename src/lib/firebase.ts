import { initializeApp, getApps, cert, getApp } from 'firebase-admin/app';
import { getFirestore, initializeFirestore } from 'firebase-admin/firestore';

let db: any;
try {
  let app: any;
  if (!getApps().length) {
    app = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } else {
    app = getApp();
  }

  try {
    db = initializeFirestore(app, { preferRest: true });
  } catch {
    db = getFirestore(app);
  }
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
