import { stripe } from "@/lib/stripe";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { sendOrderEmails } from "@/lib/email";
import { NextResponse } from "next/server";

// firebase-admin needs the Node.js runtime (not Edge).
export const runtime = "nodejs";

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
    const items = JSON.parse(session.metadata?.items ?? "[]");
    const shipping = session.shipping_details;

    const orderData = {
      stripeSessionId: session.id,
      customerEmail: session.customer_details?.email ?? null,
      customerName: session.customer_details?.name ?? null,
      shippingAddress: shipping?.address ?? null,
      items,
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

    // Mark any purchased originals (1-of-1) as sold, so the shop shows them as
    // Sold and they can't be bought twice. Idempotent (setting available:false
    // again is harmless), so it's safe to run on every delivery and self-heals
    // on a Stripe retry. Best-effort: a failure is logged but does not 500 the
    // webhook, since the order is already recorded and Anne is alerted. The
    // dot-path update leaves original.price untouched.
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
          adminDb.collection("artworks").doc(artId).update({ "original.available": false })
        )
      );
    } catch (err) {
      console.error("Failed to mark original(s) as sold:", err);
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
