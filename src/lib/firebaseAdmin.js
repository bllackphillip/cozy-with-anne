import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

/*
  FIREBASE ADMIN SDK — server-only.

  The Stripe webhook and the public form routes run on the server and must WRITE
  to Firestore (and, for commission reference images, to Cloud Storage). The
  client SDK (src/lib/firebase.js) can't do that: server-side it's
  unauthenticated, so the locked security rules (write: if request.auth …) reject
  it. The Admin SDK bypasses rules because it authenticates as a service account.

  Credentials live in env vars from a Firebase service-account key
  (Project settings → Service accounts → Generate new private key). NEVER commit
  them — they go in .env.local only. The private key contains literal "\n"
  sequences in the env file, so we unescape them back into real newlines.

  Lazily initialised so importing this file never crashes the build when the env
  vars aren't present yet — it only throws when a route actually runs.
*/

let _app;

function getAdminApp() {
  if (_app) return _app;

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Firebase Admin not configured — set FIREBASE_ADMIN_PROJECT_ID, " +
        "FIREBASE_ADMIN_CLIENT_EMAIL and FIREBASE_ADMIN_PRIVATE_KEY in .env.local."
    );
  }

  _app = getApps().length
    ? getApps()[0]
    : initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });

  return _app;
}

let _adminDb;

export function getAdminDb() {
  if (_adminDb) return _adminDb;
  _adminDb = getFirestore(getAdminApp());
  return _adminDb;
}

let _adminBucket;

// Cloud Storage bucket via the Admin SDK — used to store commission reference
// images server-side. The bucket name is the same public value the client uses.
export function getAdminBucket() {
  if (_adminBucket) return _adminBucket;
  const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  if (!bucketName) {
    throw new Error(
      "Storage bucket not configured — set NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET."
    );
  }
  _adminBucket = getStorage(getAdminApp()).bucket(bucketName);
  return _adminBucket;
}
