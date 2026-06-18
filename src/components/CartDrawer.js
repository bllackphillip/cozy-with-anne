"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";
import Link from "next/link";
import Image from "next/image";

/*
  CART DRAWER — A slide-out panel from the right side of the screen.

  TAILWIND LESSON:
  - translate-x-full = moves the panel 100% off-screen to the right (hidden)
  - translate-x-0 = moves it back to its normal position (visible)
  - transition-transform duration-300 = smooth slide animation
  - The dark overlay behind it uses bg-black/50 (50% opacity black)
*/

export default function CartDrawer() {
  const {
    cartItems,
    cartCount,
    cartTotal,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
  } = useCart();
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);

  async function handleCheckout() {
    setCheckingOut(true);
    setCheckoutError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: cartItems }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        // The route returns user-safe messages (e.g. an original that just sold);
        // fall back to a generic line if none was provided.
        setCheckoutError(
          data.error ||
            "We couldn't start checkout just now. Please try again in a moment."
        );
        setCheckingOut(false);
      }
    } catch {
      setCheckoutError("We couldn't start checkout just now. Please try again in a moment.");
      setCheckingOut(false);
    }
  }

  return (
    <>
      {/* Dark overlay — covers the page behind the drawer */}
      {/* Clicking it closes the drawer */}
      {isCartOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={() => setIsCartOpen(false)}
        />
      )}

      {/* The drawer panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-white z-50 shadow-xl transition-transform duration-300 ${
          isCartOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            Cart ({cartCount})
          </h2>
          <button
            onClick={() => setIsCartOpen(false)}
            className="p-2 text-gray-500 hover:text-gray-900 transition-colors"
            aria-label="Close cart"
          >
            {/* X icon */}
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto p-4" style={{ maxHeight: "calc(100vh - 180px)" }}>
          {cartItems.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Your cart is empty.</p>
              <button
                onClick={() => setIsCartOpen(false)}
                className="mt-4 text-sm font-medium text-gray-900 underline hover:text-gray-600"
              >
                Continue shopping
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {cartItems.map((item) => (
                <div key={item.id} className="flex gap-4">
                  {/* Item image */}
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                    <Image
                      src={item.image}
                      alt={item.title}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Item details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {item.title}
                    </h3>
                    {/* Variant label — e.g. "15×15 cm · Matte Print" */}
                    <p className="text-xs text-gray-400 truncate">{item.variantLabel}</p>
                    <p className="text-sm text-gray-500">€{item.price}</p>

                    {/* Quantity controls — originals are 1-of-1, so no stepper */}
                    {item.type === "original" ? (
                      <p className="mt-2 text-xs text-gray-400">One of a kind</p>
                    ) : (
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-gray-400 transition-colors text-sm"
                        >
                          -
                        </button>
                        <span className="text-sm text-gray-900 w-6 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-gray-400 transition-colors text-sm"
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Remove button */}
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-gray-400 hover:text-gray-600 transition-colors self-start"
                    aria-label={`Remove ${item.title}`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart footer — total and checkout button */}
        {cartItems.length > 0 && (
          <div className="border-t border-gray-100 p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-900">Total</span>
              <span className="text-lg font-semibold text-gray-900">
                €{cartTotal.toFixed(2)}
              </span>
            </div>
            <button
              className="w-full py-3 text-sm font-medium site-btn-active disabled:opacity-60"
              onClick={handleCheckout}
              disabled={checkingOut}
            >
              {checkingOut ? "Redirecting…" : "Checkout"}
            </button>
            {checkoutError && (
              <p className="mt-2 text-center text-xs text-red-600" role="alert">
                {checkoutError}
              </p>
            )}
            <p className="mt-2 text-center text-xs text-gray-400">
              Secure checkout · Powered by Stripe
            </p>
            <Link
              href="/shop"
              onClick={() => setIsCartOpen(false)}
              className="block mt-3 text-center text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              Continue shopping
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
