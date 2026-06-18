import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { NextResponse } from "next/server";

/*
  COMMISSION ENQUIRY ENDPOINT

  Persists a commission enquiry to the Firestore `enquiries` collection so
  submissions are never lost (previously the form only showed a local
  "thank you" and dropped the data).

  Validation runs server-side here, so the client can't bypass it.

  ── REQUIRED Firestore security rule ────────────────────────────────────────
  This writes with the client SDK, so the project's locked write rules must be
  extended to allow *create only* on `enquiries` (no read/update/delete from
  clients). Add to firestore.rules:

    match /enquiries/{id} {
      allow create: if request.resource.data.keys().hasOnly(
                       ['name','email','vision','status','createdAt'])
                    && request.resource.data.name is string
                    && request.resource.data.email is string
                    && request.resource.data.vision is string;
      allow read, update, delete: if false;
    }

  Upgrade path: swapping this route to the Firebase Admin SDK (service-account
  credential) would let the rules stay fully locked and remove the create rule.
  Adding e-mail delivery (e.g. Resend) is an independent follow-up.
*/

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function POST(req) {
  try {
    const { name, email, vision } = await req.json();

    if (!name?.trim() || !email?.trim() || !vision?.trim()) {
      return NextResponse.json({ error: "Please fill in all required fields." }, { status: 400 });
    }
    if (!EMAIL_RE.test(email.trim())) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    await addDoc(collection(db, "enquiries"), {
      name: name.trim().slice(0, 200),
      email: email.trim().slice(0, 200),
      vision: vision.trim().slice(0, 5000),
      status: "new",
      createdAt: serverTimestamp(),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Enquiry error:", err);
    return NextResponse.json({ error: "Could not submit enquiry." }, { status: 500 });
  }
}
