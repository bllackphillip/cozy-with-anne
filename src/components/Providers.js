"use client";

import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";

/*
  PROVIDERS WRAPPER

  layout.js is a Server Component (no "use client") so it can't directly
  use client-side Context providers. This wrapper component is a Client
  Component that holds all our providers in one place.

  AuthProvider wraps the tree (it's cheap — a single Firebase listener) so the
  admin area can read the login state; the public storefront simply ignores it.
  CartProvider sits inside it.
*/

export default function Providers({ children }) {
  return (
    <AuthProvider>
      <CartProvider>{children}</CartProvider>
    </AuthProvider>
  );
}
