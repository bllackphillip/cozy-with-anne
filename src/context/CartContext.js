"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

/*
  CART CONTEXT

  React Context lets us share cart state across the entire app without
  passing props through every component. Any component can:
  - Read the cart items
  - Add/remove items
  - Get the total price and item count

  HOW CONTEXT WORKS:
  1. createContext() creates a "channel" for sharing data
  2. CartProvider wraps the app (in layout.js) and holds the state
  3. useCart() hook lets any child component access the cart

  VARIANTS — cart items now carry variant info so the same artwork can
  appear multiple times with different options:
  {
    id,            composite key: artworkId-type-size-option (e.g. "berries-print-1515cm-matte")
    artworkId,     the source artwork id
    title,         artwork title (e.g. "Berries")
    variantLabel,  human-readable variant (e.g. "15×15 cm · Matte Print")
    type,          "original" | "print" | "sticker"
    size,          size label (null for originals)
    finish,        finish option for prints (null otherwise)
    background,    background option for stickers (null otherwise)
    price,         price of this specific variant
    image,         artwork.images[0]
    quantity,
  }
*/

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  /*
    CART PERSISTENCE (localStorage)

    The cart starts as [] on both server and first client render, so hydration
    never mismatches. After mount we read any saved cart and flip `hydrated`.
    The persist effect is gated on `hydrated` so it can't overwrite saved data
    with the empty initial state during that first commit.
  */
  const [hydrated, setHydrated] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect --
     Deliberate, hydration-safe sync with an external system (localStorage).
     The cart starts [] on the server and first client render so SSR output
     matches; only after mount do we load the persisted cart. This is the
     React-sanctioned "subscribe to an external store on mount" pattern, and
     starting empty is what prevents a hydration mismatch on the header badge. */
  useEffect(() => {
    try {
      const saved = localStorage.getItem("cwa-cart");
      if (saved) setCartItems(JSON.parse(saved));
    } catch (_) {}
    setHydrated(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem("cwa-cart", JSON.stringify(cartItems));
    } catch (_) {}
  }, [cartItems, hydrated]);

  /*
    addToCart(artwork, type, price, sizeLabel, option, imageUrl)

    artwork   — the full artwork object (for id, title, image)
    type      — "original" | "print" | "sticker"
    price     — price of the selected variant
    sizeLabel — e.g. "15×15 cm" (null for originals)
    option    — finish for prints, background for stickers (null for originals)

    A composite id is built from all variant properties so that:
    - "Berries Original" and "Berries 15×15 Matte Print" are separate cart entries
    - Adding the same variant twice increases its quantity instead
  */
  function addToCart(artwork, type, price, sizeLabel, option, imageUrl) {
    // Build a stable composite id — strip special characters to keep it clean
    const compositeId = [artwork.id, type, sizeLabel, option]
      .filter(Boolean)
      .join("-")
      .replace(/[×\s]/g, "")
      .toLowerCase();

    // Human-readable label shown in the cart drawer
    let variantLabel = "Original Painting";
    if (type === "print") variantLabel = `${sizeLabel} · ${option} Print`;
    if (type === "sticker") variantLabel = `${sizeLabel} · ${option} Sticker`;

    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === compositeId);
      if (existing) {
        // Same variant already in cart — increase quantity by 1
        return prev.map((item) =>
          item.id === compositeId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      // New variant — add as a new cart entry
      return [
        ...prev,
        {
          id: compositeId,
          artworkId: artwork.id,
          title: artwork.title,
          variantLabel,
          type,
          size: sizeLabel,
          finish: type === "print" ? option : null,
          background: type === "sticker" ? option : null,
          price,
          image: imageUrl ?? null,
          quantity: 1,
        },
      ];
    });

    // Open the cart drawer so the user sees confirmation
    setIsCartOpen(true);
  }

  // Memoised + a no-op when the cart is already empty, so it's safe to use as a
  // useEffect dependency (e.g. <ClearCart> on the order-success page). Without
  // this, a fresh function identity each render plus a new [] each call caused an
  // infinite setState loop ("Maximum update depth exceeded").
  const clearCart = useCallback(() => {
    setCartItems((prev) => (prev.length === 0 ? prev : []));
  }, []);

  // Remove an item completely from the cart
  function removeFromCart(id) {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  }

  // Update the quantity of a specific item (removes it if quantity drops below 1)
  function updateQuantity(id, newQuantity) {
    if (newQuantity < 1) {
      removeFromCart(id);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: newQuantity } : item
      )
    );
  }

  // Total number of items across all cart entries
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Total price
  const cartTotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount,
        cartTotal,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// Custom hook — shortcut so components can just call useCart()
// instead of useContext(CartContext)
export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
