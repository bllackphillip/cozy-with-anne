import { stripe } from "@/lib/stripe";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { sendOrderEmails } from "@/lib/email";
import { NextResponse } from "next/server";

// firebase-admin needs the Node.js runtime (not Edge).
export const runtime = "nodejs";

/*
  Reconstruct the ordered items from session metadata. Current format is one key
  per item (`item_count` + `item_0`…`item_{n-1}`) to stay under Stripe's 500-char
  per-key limit; older sessions used a single `items` JSON blob, still supported.
*/
function parseOrderItems(metadata) {
  if (!metadata) return [];
  const count = parseInt(metadata.item_count ?? "", 10);
  if (Number.isInteger(count) && count >= 0) {
    const out = [];
    for (let i = 0; i < count; i++) {
      const raw = metadata[`item_${i}`];
      if (!raw) continue;
      try {
        out.push(JSON.parse(raw));
      } catch {
        // skip a malformed entry rather than fail the whole order
      }
    }
    return out;
  }
  try {
    return JSON.parse(metadata.items ?? "[]");
  } catch {
    return [];
  }
}

/*
  STRIPE WEBHOOK

  Stripe POSTs events here after a payment. We verify the signature against the
  raw request body (App Router gives us the raw body via req.text() — no
  bodyParser config needed, that's a Pages-Router pattern), then on a completed
  checkout we save the order to Firestore via the Admin SDK.

  Local testing: run the Stripe CLI so events reach localhost —
    stripe listen --forward-to localhost:3000/api/webhooks/stripe
  It prints a whsec_… signing secret; put it in .env.local as STRIPE_WEBHOOK_SECRET.
*/
export async function POST(req) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const items = parseOrderItems(session.metadata);
    const shipping = session.shipping_details;

    const orderData = {
      stripeSessionId: session.id,
      customerEmail: session.customer_details?.email ?? null,
      customerName: session.customer_details?.name ?? null,
      shippingAddress: shipping?.address ?? null,
      items,
      shippingCost:
        session.shipping_cost?.amount_total != null
          ? session.shipping_cost.amount_total / 100
          : null,
      amountTotal: session.amount_total / 100,
      currency: session.currency,
      status: "paid",
      createdAt: FieldValue.serverTimestamp(),
    };

    // Idempotent write: use the Stripe session id as the document id, so a
    // re-delivered webhook (Stripe retries on non-2xx, and can deliver twice)
    // overwrites the same order document instead of creating a duplicate.
    // isFirstDelivery gates the emails so a retry can't double-send them.
    let isFirstDelivery = false;
    let adminDb;
    try {
      adminDb = getAdminDb();
      const ref = adminDb.collection("orders").doc(session.id);
      const existing = await ref.get();
      isFirstDelivery = !existing.exists;
      await ref.set(orderData);
    } catch (err) {
      // Log and 500 so Stripe retries. Don't swallow a failed order write.
      console.error("Failed to save order:", err);
      return NextResponse.json({ error: "Order save failed" }, { status: 500 });
    }

    // Mark any purchased originals (1-of-1) as sold, in a transaction that also
    // DETECTS a concurrent double-sale. Each original is claimed atomically:
    //   - available is true  → set available:false and stamp soldOrderId = this
    //     session (claims the piece; the dot-path leaves original.price untouched).
    //   - already sold by THIS session → no-op (idempotent on a Stripe retry).
    //   - already sold by a DIFFERENT order → a genuine oversell. We don't fail
    //     the webhook (the payment already happened); instead we flag the order
    //     so Anne can refund one buyer. (available:false with no soldOrderId is a
    //     legacy-sold piece — we adopt it rather than false-flag a conflict.)
    // Best-effort: a transaction failure is logged but does not 500 the webhook,
    // since the order is already recorded and Anne is alerted.
    const conflictArtworkIds = [];
    try {
      const originalIds = [
        ...new Set(
          items
            .filter((it) => it.type === "original" && it.artworkId)
            .map((it) => it.artworkId)
        ),
      ];
      await Promise.all(
        originalIds.map((artId) =>
          adminDb.runTransaction(async (tx) => {
            const artRef = adminDb.collection("artworks").doc(artId);
            const snap = await tx.get(artRef);
            if (!snap.exists) return;
            const original = snap.data().original ?? {};
            if (
              original.available === false &&
              original.soldOrderId &&
              original.soldOrderId !== session.id
            ) {
              conflictArtworkIds.push(artId);
              return;
            }
            tx.update(artRef, {
              "original.available": false,
              "original.soldOrderId": session.id,
            });
          })
        )
      );
    } catch (err) {
      console.error("Failed to mark original(s) as sold:", err);
    }

    // Record any detected oversell on the order so the admin sees it and Anne's
    // alert email can warn her to review/refund. Merge so the order doc is kept.
    if (conflictArtworkIds.length) {
      orderData.conflict = true;
      orderData.conflictArtworkIds = conflictArtworkIds;
      try {
        await adminDb
          .collection("orders")
          .doc(session.id)
          .set({ conflict: true, conflictArtworkIds }, { merge: true });
      } catch (err) {
        console.error("Failed to flag order conflict:", err);
      }
    }

    // Confirmation to the buyer + alert to Anne, only on first delivery.
    // Best-effort: an email failure must NOT 500 the webhook (that would make
    // Stripe retry and risk re-sending the email to someone who already got it).
    if (isFirstDelivery) {
      try {
        await sendOrderEmails(orderData);
      } catch (err) {
        console.error("Order emails failed:", err);
      }
    }
  }

  return NextResponse.json({ received: true });
}
