import { getAdminDb } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";

// firebase-admin needs the Node.js runtime (not Edge).
export const runtime = "nodejs";

/*
  COMMISSION ENQUIRY ENDPOINT

  Persists a commission enquiry to the Firestore `enquiries` collection so
  submissions are never lost. Validation runs server-side here.

  SECURITY: written with the Firebase Admin SDK (service-account credential), so
  the public has NO direct write access to Firestore. The rules deny all client
  writes to `enquiries` (`allow write: if false`); only this trusted server route
  can create one. A hidden honeypot field drops obvious bots before any write.
*/

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function POST(req) {
  try {
    const { name, email, vision, company } = await req.json();

    // Honeypot: a field hidden from real users. Anything filling it is a bot, so
    // accept silently (no error, which would tip it off) and write nothing.
    if (company) return NextResponse.json({ ok: true });

    if (!name?.trim() || !email?.trim() || !vision?.trim()) {
      return NextResponse.json({ error: "Please fill in all required fields." }, { status: 400 });
    }
    if (!EMAIL_RE.test(email.trim())) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    await getAdminDb().collection("enquiries").add({
      name: name.trim().slice(0, 200),
      email: email.trim().slice(0, 200),
      vision: vision.trim().slice(0, 5000),
      status: "new",
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Enquiry error:", err);
    return NextResponse.json({ error: "Could not submit enquiry." }, { status: 500 });
  }
}
