import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

/*
  FIREBASE ADMIN SDK — server-only.

  The Stripe webhook runs on the server and must WRITE the order to Firestore.
  The client SDK (src/lib/firebase.js) can't do that: server-side it's
  unauthenticated, so the locked security rules (write: if request.auth …) reject
  it. The Admin SDK bypasses rules because it authenticates as a service account.

  Credentials live in env vars from a Firebase service-account key
  (Project settings → Service accounts → Generate new private key). NEVER commit
  them — they go in .env.local only. The private key contains literal "\n"
  sequences in the env file, so we unescape them back into real newlines.

  Lazily initialised so importing this file never crashes the build when the env
  vars aren't present yet — it only throws when the webhook actually runs.
*/

let _adminDb;

export function getAdminDb() {
  if (_adminDb) return _adminDb;

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Firebase Admin not configured — set FIREBASE_ADMIN_PROJECT_ID, " +
        "FIREBASE_ADMIN_CLIENT_EMAIL and FIREBASE_ADMIN_PRIVATE_KEY in .env.local."
    );
  }

  const app = getApps().length
    ? getApps()[0]
    : initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });

  _adminDb = getFirestore(app);
  return _adminDb;
}
