import { stripe } from "@/lib/stripe";
import { getArtworksByIds } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { items } = await req.json();

    if (!items?.length) {
      return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
    }

    /*
      INTEGRITY GUARD — originals are 1-of-1. A cart can outlive a sale: a piece
      can be added in another tab/session (or a stale client) and sell before the
      buyer checks out. Without a server-side re-check, that stale cart would pay
      for an already-sold original. So before creating the Checkout Session we
      re-read every original's live availability from Firestore and refuse if any
      has sold. (Prints/stickers are unlimited, so they're skipped.) This is the
      authoritative gate; the cart's "Sold" UI is only a hint and can be stale.
    */
    const originalIds = [
      ...new Set(
        items.filter((i) => i.type === "original").map((i) => i.artworkId)
      ),
    ];
    if (originalIds.length) {
      try {
        const arts = await getArtworksByIds(originalIds);
        const byId = Object.fromEntries(arts.map((a) => [a.id, a]));
        const soldOut = items.filter(
          (i) =>
            i.type === "original" &&
            byId[i.artworkId]?.original?.available === false
        );
        if (soldOut.length) {
          const names = soldOut.map((i) => `"${i.title}"`).join(", ");
          const plural = soldOut.length > 1;
          return NextResponse.json(
            {
              error: `${names} just sold and ${
                plural ? "are" : "is"
              } no longer available. Please remove ${
                plural ? "them" : "it"
              } from your cart to continue.`,
              code: "ITEM_UNAVAILABLE",
            },
            { status: 409 }
          );
        }
      } catch (lookupErr) {
        // Fail open on a transient read error so a Firestore hiccup doesn't block
        // every checkout. The webhook's idempotent mark-sold remains the backstop
        // that keeps order/availability data correct.
        console.warn("Availability check skipped (lookup failed):", lookupErr);
      }
    }

    const line_items = items.map((item) => ({
      price_data: {
        currency: "eur",
        product_data: {
          name: item.variantLabel
            ? `${item.title} - ${item.variantLabel}`
            : item.title,
          images: item.image ? [item.image] : [],
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/order/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/shop`,
      shipping_address_collection: {
        allowed_countries: ["GB", "IE", "FR", "DE", "NL", "BE", "ES", "IT", "PT", "RO", "US", "CA", "AU"],
      },
      metadata: {
        items: JSON.stringify(
          items.map((i) => ({
            artworkId: i.artworkId,
            type: i.type,
            title: i.title,
            variantLabel: i.variantLabel,
            price: i.price,
            quantity: i.quantity,
          }))
        ),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    // Log the real error server-side; return a safe, generic message to the client.
    console.error("Stripe checkout error:", err);
    return NextResponse.json(
      { error: "We couldn't start checkout just now. Please try again in a moment." },
      { status: 500 }
    );
  }
}
