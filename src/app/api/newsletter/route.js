import { getAdminDb } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";

// firebase-admin needs the Node.js runtime (not Edge).
export const runtime = "nodejs";

/*
  NEWSLETTER SIGNUP ENDPOINT

  Persists a subscriber to the Firestore `subscribers` collection. Validation runs
  server-side here.

  SECURITY: written with the Firebase Admin SDK, so the public has NO direct write
  access to Firestore. The rules deny all client writes to `subscribers`; only this
  trusted server route can create one. A hidden honeypot field drops obvious bots.

  DEDUPE: the document id IS the (lowercased) email, so re-subscribing overwrites
  the same row instead of creating duplicate sign-ups. `createdAt` therefore tracks
  the most recent sign-up. A welcome email (Resend from newsletter@cozywithanne.com)
  is a future follow-up.
*/

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function POST(req) {
  try {
    const { email, company } = await req.json();

    // Honeypot — accept silently and write nothing.
    if (company) return NextResponse.json({ ok: true });

    if (!email?.trim()) {
      return NextResponse.json({ error: "Please enter your email address." }, { status: 400 });
    }
    const clean = email.trim().toLowerCase();
    if (!EMAIL_RE.test(clean)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    // '/' is invalid in a real email but would break a Firestore doc id (path
    // separator), so guard it just in case the regex let one through.
    const id = clean.slice(0, 1500).replace(/\//g, "_");
    await getAdminDb().collection("subscribers").doc(id).set({
      email: clean,
      status: "subscribed",
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Newsletter signup error:", err);
    return NextResponse.json({ error: "Could not sign you up. Please try again." }, { status: 500 });
  }
}
