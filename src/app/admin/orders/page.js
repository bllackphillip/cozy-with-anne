"use client";

import { useEffect, useState } from "react";
import { getOrders } from "@/lib/db";

/*
  ORDERS — read-only list of completed purchases.

  Orders are written server-side by the Stripe webhook (one document per
  checkout session), so this page only reads them. It stays empty until Stripe
  is switched live; that's expected, not a bug.
*/

function formatDate(ts) {
  if (!ts?.seconds) return "";
  return new Date(ts.seconds * 1000).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function money(amount, currency) {
  if (typeof amount !== "number") return "";
  try {
    return new Intl.NumberFormat("en-IE", { style: "currency", currency: (currency ?? "eur").toUpperCase() }).format(amount);
  } catch {
    return `€${amount}`;
  }
}

export default function OrdersPage() {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getOrders()
      .then(setOrders)
      .catch((err) => {
        console.error(err);
        setError("Could not load orders.");
      });
  }, []);

  if (error && !orders) return <p className="text-red-600">{error}</p>;
  if (!orders) return <p className="text-gray-400">Loading…</p>;

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl text-[var(--color-accent)]" style={{ fontFamily: "var(--font-fraunces)" }}>Orders</h1>
      <p className="mt-1 text-gray-500">{orders.length} order{orders.length === 1 ? "" : "s"}.</p>

      {orders.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-gray-300 p-8 text-center">
          <p className="text-sm text-gray-500">No orders yet.</p>
          <p className="mt-1 text-xs text-gray-400">
            Orders will appear here automatically once Stripe is switched to live mode and a customer checks out.
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {orders.map((o) => (
            <li key={o.id} className="rounded-2xl border border-gray-200 bg-white p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900">{o.customerName ?? "Customer"}</p>
                  <p className="text-sm text-gray-500 break-all">{o.customerEmail}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-semibold text-gray-900">{money(o.amountTotal, o.currency)}</p>
                  <p className="text-xs text-gray-400">{formatDate(o.createdAt)}</p>
                </div>
              </div>

              {Array.isArray(o.items) && o.items.length > 0 && (
                <ul className="mt-3 border-t border-gray-100 pt-3 space-y-1">
                  {o.items.map((it, i) => (
                    <li key={i} className="flex justify-between text-sm text-gray-600">
                      <span className="truncate">
                        {it.quantity ? `${it.quantity}× ` : ""}
                        {it.title ?? it.name ?? "Item"}
                        {it.variantLabel ? ` - ${it.variantLabel}` : ""}
                      </span>
                      {typeof it.price === "number" && <span className="shrink-0 ml-3">{money(it.price, o.currency)}</span>}
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                  {o.status ?? "paid"}
                </span>
                <span className="text-xs text-gray-400 font-mono truncate">{o.stripeSessionId}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
