"use client";

import { useEffect } from "react";
import { useCart } from "@/context/CartContext";

/*
  The success page is a server component (it retrieves the Stripe session), so
  it can't clear the cart itself. This tiny client child does it on mount —
  the customer has paid, so emptying the cart is the correct post-purchase state.
*/
export default function ClearCart() {
  const { clearCart } = useCart();
  useEffect(() => {
    clearCart();
  }, [clearCart]);
  return null;
}
