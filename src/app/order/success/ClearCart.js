"use client";

import { useEffect } from "react";
import { useCart } from "@/context/CartContext";

/*
  The success page is a server component (it retrieves the Stripe session), so
  it can't clear the cart itself. This tiny client child does it on mount —
  the customer has paid, so emptying the cart is the correct post-purchase state.
*/
export default function ClearCart() {
  const { clearCart, hydrated } = useCart();
  // Wait for the provider to load the saved cart from localStorage first.
  // ClearCart's effect (a child) fires before the provider's hydration effect
  // (the parent), so clearing immediately would be undone when the saved cart
  // is restored a moment later. Gating on `hydrated` clears after the restore.
  useEffect(() => {
    if (hydrated) clearCart();
  }, [hydrated, clearCart]);
  return null;
}
