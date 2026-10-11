import { initializeApp, getApps, cert, getApp } from "firebase-admin/app";
import {
  getFirestore,
  initializeFirestore,
  Firestore,
} from "firebase-admin/firestore";
let instance: Firestore | undefined;
export function setDatabaseInstance(customDb?: Firestore) {
  instance = customDb;
}

function database(): Firestore {
  if (instance) return instance;
  const {
    FIREBASE_PROJECT_ID: projectId,
    FIREBASE_CLIENT_EMAIL: clientEmail,
    FIREBASE_PRIVATE_KEY: privateKey,
    NODE_ENV,
    APP_ENV,
    FIRESTORE_EMULATOR_HOST,
  } = process.env;

  const isTest =
    NODE_ENV === "test" ||
    APP_ENV === "test" ||
    !!process.env.npm_lifecycle_event?.includes("test") ||
    !!FIRESTORE_EMULATOR_HOST;

  const isPreview =
    process.env.VERCEL_ENV === "preview" ||
    process.env.NEXT_PUBLIC_VERCEL_ENV === "preview" ||
    APP_ENV === "preview";

  const isStaging =
    APP_ENV === "staging" ||
    (NODE_ENV as string) === "staging";

  const stagingAllowedProject =
    process.env.FIREBASE_STAGING_PROJECT_ID || "fairy-house-keys-staging";

  if ((isTest || isStaging || isPreview) && projectId === "fairy-house-keys") {
    throw new Error(
      "SECURITY_GUARD_VIOLATION: Production database 'fairy-house-keys' cannot be accessed in test, staging or preview environment.",
    );
  }

  if (isStaging && projectId && projectId !== stagingAllowedProject && !FIRESTORE_EMULATOR_HOST && !projectId.startsWith("demo-")) {
    throw new Error(
      `SECURITY_GUARD_VIOLATION: Staging environment must use staging project '${stagingAllowedProject}', got '${projectId}'.`,
    );
  }

  const emulator =
    NODE_ENV !== "production" &&
    FIRESTORE_EMULATOR_HOST;
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

