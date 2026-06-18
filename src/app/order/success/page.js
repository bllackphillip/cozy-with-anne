import Link from "next/link";
import { stripe } from "@/lib/stripe";
import ClearCart from "./ClearCart";
import ConfirmationMessage from "./ConfirmationMessage";

// Reads the real Stripe session, so it must run server-side per request.
export const runtime = "nodejs";

/*
  ORDER SUCCESS — the post-purchase trust moment (Pavlou 2003; McKnight
  Benevolence). We retrieve the real Checkout Session to greet the buyer by name
  and confirm the email it was sent to, then show warm, artist-voice copy rather
  than a generic receipt. If the session can't be fetched (e.g. someone lands
  here without a valid id) we fall back to generic copy instead of erroring.
*/
export default async function OrderSuccessPage({ searchParams }) {
  const { session_id } = await searchParams;

  let session = null;
  if (session_id) {
    try {
      session = await stripe.checkout.sessions.retrieve(session_id, {
        expand: ["line_items"],
      });
    } catch {
      // ignore — show generic confirmation below
    }
  }

  // A session id that exists but hasn't been paid (unpaid, expired, or someone
  // probing the URL) must not show a "thank you" or clear the cart. We only treat
  // a session as a real order when Stripe reports payment_status "paid". A missing
  // session (transient retrieve failure / no id) keeps the friendly fallback below.
  if (session && session.payment_status !== "paid") {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <div className="text-5xl mb-6">🧾</div>
        <h1
          className="text-3xl sm:text-4xl text-[var(--color-accent)]"
          style={{ fontFamily: "var(--font-fraunces)" }}
        >
          This order isn&apos;t confirmed yet
        </h1>
        <p className="mt-6 text-gray-600 leading-relaxed">
          We couldn&apos;t confirm a completed payment for this link. If you just
          paid, give it a moment and refresh. If you think something went wrong,
          reach out at{" "}
          <a
            href="mailto:support@cozywithanne.com"
            className="text-[var(--color-accent)] hover:underline"
          >
            support@cozywithanne.com
          </a>
          .
        </p>
        <div className="mt-10">
          <Link href="/shop" className="px-8 py-3 text-sm font-medium site-btn inline-block">
            Back to Shop
          </Link>
        </div>
      </div>
    );
  }

  const firstName = session?.customer_details?.name?.split(" ")[0];
  const email = session?.customer_details?.email;
  const lineItems = session?.line_items?.data ?? [];
  const shippingCost =
    session?.shipping_cost?.amount_total != null
      ? session.shipping_cost.amount_total / 100
      : null;
  const total = session ? session.amount_total / 100 : null;

  return (
    <div className="max-w-xl mx-auto px-4 py-24 text-center">
      {/* Empty the cart now that payment succeeded */}
      <ClearCart />

      {/* Experiment A: warm artist-voice vs generic receipt copy */}
      <ConfirmationMessage firstName={firstName} email={email} />

      {/* Order summary — only when we successfully retrieved the session */}
      {lineItems.length > 0 && (
        <div className="mt-8 text-left border border-[var(--color-border-warm)] rounded-2xl p-5 bg-[var(--color-surface)]">
          <ul className="divide-y divide-[var(--color-border-warm)]">
            {lineItems.map((li) => (
              <li key={li.id} className="flex justify-between gap-4 py-2 text-sm">
                <span className="text-gray-700">
                  {li.description}
                  {li.quantity > 1 ? ` × ${li.quantity}` : ""}
                </span>
                <span className="text-gray-900 whitespace-nowrap">
                  €{(li.amount_total / 100).toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
          {shippingCost != null && (
            <div className="flex justify-between pt-3 text-sm text-gray-600">
              <span>Shipping</span>
              <span>{shippingCost === 0 ? "Free" : `€${shippingCost.toFixed(2)}`}</span>
            </div>
          )}
          {total != null && (
            <div className="flex justify-between pt-3 mt-1 border-t border-[var(--color-border-warm)] text-sm font-semibold text-gray-900">
              <span>Total</span>
              <span>€{total.toFixed(2)}</span>
            </div>
          )}
        </div>
      )}

      <p className="mt-6 text-gray-500 text-sm">
        Questions? Reach out at{" "}
        <a href="mailto:support@cozywithanne.com" className="text-[var(--color-accent)] hover:underline">
          support@cozywithanne.com
        </a>
      </p>
      <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
        <Link href="/shop" className="px-8 py-3 text-sm font-medium site-btn inline-block">
          Back to Shop
        </Link>
        <Link href="/portfolio" className="px-8 py-3 text-sm font-medium border border-[var(--color-border-warm)] text-[var(--color-accent)] rounded-full hover:bg-[var(--color-surface)] transition-colors inline-block">
          Browse Portfolio
        </Link>
      </div>
    </div>
  );
}
