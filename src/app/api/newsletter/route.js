import { getAdminDb } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { sendNewsletterWelcome } from "@/lib/email";

// firebase-admin needs the Node.js runtime (not Edge).
export const runtime = "nodejs";

/*
  NEWSLETTER SIGNUP ENDPOINT

  Persists a subscriber to the Firestore `subscribers` collection. Validation runs
  server-side here.

  SECURITY: written with the Firebase Admin SDK, so the public has NO direct write
  access to Firestore. The rules deny all client writes to `subscribers`; only this
  trusted server route can create one. A hidden honeypot field drops obvious bots.

  DEDUPE: the document id IS the (lowercased) email, so there can only ever be one
  row per address. We read it first: if it already exists we leave it untouched
  (keep the original `createdAt`, don't re-send the welcome) and tell the client so
  it can show an "already on the list" message. A brand-new subscriber gets the row
  written and a warm welcome email (best-effort, Resend-gated).
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
    const ref = getAdminDb().collection("subscribers").doc(id);

    // Already on the list: don't overwrite their row or re-send the welcome.
    const existing = await ref.get();
    if (existing.exists) {
      return NextResponse.json({ ok: true, alreadySubscribed: true });
    }

    await ref.set({
      email: clean,
      status: "subscribed",
      createdAt: FieldValue.serverTimestamp(),
    });

    // Warm welcome (best-effort): a send failure must not fail the signup, which
    // is already saved.
    try {
      await sendNewsletterWelcome({ email: clean });
    } catch (err) {
      console.error("Newsletter welcome email failed:", err);
    }

    return NextResponse.json({ ok: true, alreadySubscribed: false });
  } catch (err) {
    console.error("Newsletter signup error:", err);
    return NextResponse.json({ error: "Could not sign you up. Please try again." }, { status: 500 });
  }
}
