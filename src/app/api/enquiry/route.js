import { getAdminDb, getAdminBucket } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { sendEnquiryEmails } from "@/lib/email";

// firebase-admin needs the Node.js runtime (not Edge).
export const runtime = "nodejs";

/*
  COMMISSION ENQUIRY ENDPOINT

  Persists a commission enquiry to the Firestore `enquiries` collection so
  submissions are never lost, and (optionally) stores the customer's reference
  image in Cloud Storage. Validation runs server-side here.

  SECURITY: written with the Firebase Admin SDK (service-account credential), so
  the public has NO direct write access to Firestore or Storage. The rules deny
  all client writes to `enquiries` and reads of `enquiry-attachments/**` (only
  the owner / the capability URL below can read them). A hidden honeypot field
  drops obvious bots before any write.

  The form may POST either multipart/form-data (with the reference image) or, for
  robustness, plain JSON.
*/

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8 MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
];

export async function POST(req) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let name;
    let email;
    let vision;
    let company;
    let file = null;

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      name = form.get("name");
      email = form.get("email");
      vision = form.get("vision");
      company = form.get("company");
      const f = form.get("attachment");
      if (f && typeof f === "object" && typeof f.arrayBuffer === "function" && f.size > 0) {
        file = f;
      }
    } else {
      ({ name, email, vision, company } = await req.json());
    }

    // Honeypot: a field hidden from real users. Anything filling it is a bot, so
    // accept silently (no error, which would tip it off) and write nothing.
    if (company) return NextResponse.json({ ok: true });

    if (!name?.trim() || !email?.trim() || !vision?.trim()) {
      return NextResponse.json({ error: "Please fill in all required fields." }, { status: 400 });
    }
    if (!EMAIL_RE.test(email.trim())) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    // Validate the optional attachment before any write.
    if (file) {
      if (file.size > MAX_FILE_BYTES) {
        return NextResponse.json({ error: "That file is too large (max 8 MB)." }, { status: 400 });
      }
      if (file.type && !ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json({ error: "Please attach an image or a PDF." }, { status: 400 });
      }
    }

    const cleanName = name.trim().slice(0, 200);
    const cleanEmail = email.trim().slice(0, 200);
    const cleanVision = vision.trim().slice(0, 5000);

    // Create the enquiry first so we have its id for the attachment path.
    const docRef = await getAdminDb().collection("enquiries").add({
      name: cleanName,
      email: cleanEmail,
      vision: cleanVision,
      status: "new",
      createdAt: FieldValue.serverTimestamp(),
    });

    // Upload the reference image (best-effort): if it fails, the enquiry is still
    // saved — Anne can ask for the image by reply rather than lose the enquiry.
    // A download token is stored so the owner's inbox can show the image via an
    // unguessable capability URL, while the storage rules keep the path itself
    // private (not publicly listable or readable).
    let attachmentUrl = null;
    if (file) {
      try {
        const safeName =
          (file.name || "reference").replace(/[^a-zA-Z0-9.\-_]/g, "-").slice(0, 120) || "reference";
        const path = `enquiry-attachments/${docRef.id}/${safeName}`;
        const token = randomUUID();
        const buffer = Buffer.from(await file.arrayBuffer());
        await getAdminBucket()
          .file(path)
          .save(buffer, {
            resumable: false,
            metadata: {
              contentType: file.type || "application/octet-stream",
              metadata: { firebaseStorageDownloadTokens: token },
            },
          });
        const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
        attachmentUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(
          path
        )}?alt=media&token=${token}`;
        await docRef.update({ attachmentPath: path, attachmentUrl });
      } catch (err) {
        console.error("Enquiry attachment upload failed:", err);
      }
    }

    // Confirmation to the sender + alert to Anne. Best-effort: an email failure
    // must not fail the enquiry (it is already saved and visible in the admin inbox).
    try {
      await sendEnquiryEmails({ name: cleanName, email: cleanEmail, vision: cleanVision, attachmentUrl });
    } catch (err) {
      console.error("Enquiry emails failed:", err);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Enquiry error:", err);
    return NextResponse.json({ error: "Could not submit enquiry." }, { status: 500 });
  }
}
