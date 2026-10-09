import { initializeApp, getApps, cert, getApp } from "firebase-admin/app";
import {
  getFirestore,
  initializeFirestore,
  Firestore,
} from "firebase-admin/firestore";
let instance: Firestore | undefined;
function database(): Firestore {
  if (instance) return instance;
  const {
    FIREBASE_PROJECT_ID: projectId,
    FIREBASE_CLIENT_EMAIL: clientEmail,
    FIREBASE_PRIVATE_KEY: privateKey,
  } = process.env;
  const emulator =
    process.env.NODE_ENV !== "production" &&
    process.env.FIRESTORE_EMULATOR_HOST;
  if (!projectId || (!emulator && (!clientEmail || !privateKey)))
    throw new Error("FIREBASE_CONFIG_MISSING");
  const app = getApps().length
    ? getApp()
    : initializeApp(
        emulator
          ? { projectId }
          : {
              credential: cert({
                projectId,
                clientEmail,
                privateKey: privateKey!.replace(/\\n/g, "\n"),
              }),
            },
      );
  try {
    instance = initializeFirestore(app, { preferRest: !emulator });
  } catch {
    instance = getFirestore(app);
  }
  return instance;
}
// Lazy initialization permits builds without credentials; real operations fail closed.
export const db: Firestore = new Proxy({} as Firestore, {
  get(_, property) {
    const target = database();
    const value = Reflect.get(target, property);
    return typeof value === "function" ? value.bind(target) : value;
  },
});
