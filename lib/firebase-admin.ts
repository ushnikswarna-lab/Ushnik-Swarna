import * as admin from "firebase-admin";
import { getApps } from "firebase-admin/app";

// Lazy initialization to avoid build-time errors when env vars are missing
let _initialized = false;

function initializeFirebaseAdmin() {
  if (_initialized || getApps().length > 0) {
    _initialized = true;
    return;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

  if (!projectId || !privateKey || !clientEmail) {
    throw new Error(
      "Firebase Admin SDK requires FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, and FIREBASE_CLIENT_EMAIL environment variables"
    );
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        privateKey,
        clientEmail,
      } as admin.ServiceAccount),
    });
    _initialized = true;
  } catch (error) {
    console.error("Firebase Admin initialization error:", error);
    throw error;
  }
}

export function getFirebaseAdmin() {
  initializeFirebaseAdmin();
  return admin;
}

export function getFirestore() {
  initializeFirebaseAdmin();
  return admin.firestore();
}

export function getAuth() {
  initializeFirebaseAdmin();
  return admin.auth();
}
