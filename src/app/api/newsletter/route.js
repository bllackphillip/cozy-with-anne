import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { NextResponse } from "next/server";

/*
  NEWSLETTER SIGNUP ENDPOINT

  Persists a newsletter subscriber to the Firestore `subscribers` collection so
  sign-ups from the end-of-collection band are never lost (previously the form
  only showed a local "thank you" and dropped the address).

  Validation runs server-side here, so the client can't bypass it.

  ── REQUIRED Firestore security rule ────────────────────────────────────────
  This writes with the client SDK, so the project's locked write rules must be
  extended to allow *create only* on `subscribers` (no read/update/delete from
  clients). Add to firestore.rules:

    match /subscribers/{id} {
      allow create: if request.resource.data.keys().hasOnly(
                       ['email','status','createdAt'])
                    && request.resource.data.email is string;
      allow read, update, delete: if false;
    }

  Upgrade path: swapping this route to the Firebase Admin SDK would let the rules
  stay fully locked. Sending a welcome email (e.g. Resend from
  newsletter@cozywithanne.com) is an independent follow-up.
*/

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function POST(req) {
  try {
    const { email } = await req.json();

    if (!email?.trim()) {
      return NextResponse.json({ error: "Please enter your email address." }, { status: 400 });
    }
    if (!EMAIL_RE.test(email.trim())) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    await addDoc(collection(db, "subscribers"), {
      email: email.trim().slice(0, 200),
      status: "subscribed",
      createdAt: serverTimestamp(),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Newsletter signup error:", err);
    return NextResponse.json({ error: "Could not sign you up. Please try again." }, { status: 500 });
  }
}
