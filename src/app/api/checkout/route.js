import { stripe } from "@/lib/stripe";
import { getArtworksByIds } from "@/lib/db";
import { shippingForCountry } from "@/lib/shipping";
import { NextResponse } from "next/server";

/*
  Server-authoritative price for a cart line, read from the artwork document.
  The client sends a price, but we never trust it — a tampered POST could claim
  any amount (e.g. €1 for a €120 original). We recompute from Firestore and
  charge that. Returns null when the line can't be priced (unknown id, unknown
  print size, or a type/shape mismatch) so the caller can reject it.

  Shapes: original → original.price · print → prints.sizes[] matched by size
  label (finish does not change price) · sticker → stickers.size.price (a single
  size; background does not change price).
*/
function resolvePrice(artwork, item) {
  if (!artwork) return null;
  if (item.type === "original") return artwork.original?.price ?? null;
  if (item.type === "print") {
    const size = artwork.prints?.sizes?.find((s) => s.label === item.size);
    return size?.price ?? null;
  }
  if (item.type === "sticker") return artwork.stickers?.size?.price ?? null;
  return null;
}

export async function POST(req) {
  try {
    const { items, country } = await req.json();

    if (!items?.length) {
      return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
    }

    /*
      Re-read every referenced artwork once. Both price and availability come
      from this read, never from the client. Because money depends on it, this
      lookup fails CLOSED: if the catalogue can't be read we refuse checkout
      rather than guess prices. (The availability-only check used to fail open;
      pricing raises the stakes.)
    */
    const ids = [...new Set(items.map((i) => i.artworkId).filter(Boolean))];
    let artworks = [];
    try {
      artworks = await getArtworksByIds(ids);
    } catch (lookupErr) {
      console.error("Checkout catalogue lookup failed:", lookupErr);
      return NextResponse.json(
        { error: "We couldn't start checkout just now. Please try again in a moment." },
        { status: 503 }
      );
    }
    const byId = Object.fromEntries(artworks.map((a) => [a.id, a]));

    /*
      OVERSELL GUARD — originals are 1-of-1. Refuse any that has already sold
      before charging, so a stale cart (a piece added in another tab/session
      that sold in the meantime) can't double-sell a one-of-a-kind work.
    */
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

    /*
      PRICE GUARD — build each line from server data: server price, server
      title, and originals forced to quantity 1. The client's `price` is ignored
      entirely; `variantLabel` is kept only as a cosmetic descriptor.
    */
    const priced = [];
    for (const item of items) {
      const artwork = byId[item.artworkId];
      const price = resolvePrice(artwork, item);
      if (price == null) {
        return NextResponse.json(
          {
            error:
              "One of your items is no longer available. Please refresh your cart and try again.",
            code: "ITEM_INVALID",
          },
          { status: 409 }
        );
      }
      const quantity =
        item.type === "original"
          ? 1
          : Math.max(1, Math.min(99, Math.floor(Number(item.quantity) || 1)));
      priced.push({
        artworkId: item.artworkId,
        type: item.type,
        title: artwork.title,
        variantLabel: item.variantLabel,
        price,
        quantity,
        image: item.image,
      });
    }

    /*
      SHIPPING — the customer chooses their country in the cart, so we resolve the
      ONE correct rate here (subtotal drives the free-over-threshold) and send
      Stripe a single, non-editable shipping option. The address is then locked to
      that country (allowed_countries below), which removes the old hosted-Checkout
      flaw where a buyer could self-select a cheaper zone than their destination.
      Rate logic lives in src/lib/shipping.js, shared with the cart so the cost
      shown before checkout matches what is charged.
    */
    const subtotal = priced.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const ship = country ? shippingForCountry(country, subtotal) : null;
    if (!ship) {
      return NextResponse.json(
        {
          error: "Please choose your shipping destination before checkout.",
          code: "NO_SHIPPING_COUNTRY",
        },
        { status: 400 }
      );
    }
    const shipping_options = [
      {
        shipping_rate_data: {
          type: "fixed_amount",
          fixed_amount: { amount: Math.round(ship.cost * 100), currency: "eur" },
          display_name: ship.cost === 0 ? `${ship.label} - Free` : ship.label,
          delivery_estimate: {
            minimum: { unit: "business_day", value: ship.minDays },
            maximum: { unit: "business_day", value: ship.maxDays },
          },
        },
      },
    ];

    const line_items = priced.map((item) => ({
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
        // Locked to the country chosen in the cart, so the address must match the
        // zone we priced — the buyer cannot ship somewhere the rate doesn't cover.
        allowed_countries: [country],
      },
      shipping_options,
      metadata: {
        /*
          One metadata key PER item, not a single JSON blob. Stripe caps each
          metadata value at 500 chars, which a 4+ item cart overflowed (the whole
          cart serialised into one `items` key). Per-item keys (`item_0`…) keep
          each value small; Stripe allows up to 50 keys, so ~49 items fit. The
          webhook reconstructs from `item_count` + `item_N` (and still falls back
          to a legacy `items` blob for any older session).
        */
        item_count: String(priced.length),
        ...Object.fromEntries(
          priced.map((i, idx) => [
            `item_${idx}`,
            JSON.stringify({
              artworkId: i.artworkId,
              type: i.type,
              title: i.title,
              variantLabel: i.variantLabel,
              price: i.price,
              quantity: i.quantity,
            }),
          ])
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
