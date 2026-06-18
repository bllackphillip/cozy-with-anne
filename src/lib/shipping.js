/*
  SHIPPING ZONES — single source of truth for destination -> zone -> rate, shared
  by the cart drawer (to show the real cost BEFORE checkout) and /api/checkout (to
  charge the one correct, locked rate). Plain JS, no server-only deps, so it is
  safe to import from both a client component and the API route.

  Anne's confirmed rates (mirrors the published shipping policy):
    - Netherlands:    €5, free over €20 (subtotal)
    - Rest of Europe: €25, free over €300
    - Rest of world:  €50 flat (no free threshold)

  WHY a country picker: hosted Stripe Checkout shows shipping_options as
  buyer-selectable radios and cannot bind a rate to the typed address, so a buyer
  could pick a cheaper zone than their destination. By asking for the country in
  the cart we resolve the single correct rate ourselves, send Stripe just that one
  option, and lock the address to the chosen country.
*/

export const ZONES = {
  nl: { label: "Netherlands", base: 5, freeOver: 20, minDays: 1, maxDays: 3 },
  eu: { label: "Europe", base: 25, freeOver: 300, minDays: 2, maxDays: 7 },
  world: { label: "Rest of world", base: 50, freeOver: null, minDays: 5, maxDays: 15 },
};

// Countries we ship to (ISO 3166-1 alpha-2), each mapped to a zone. The codes are
// also what we pass to Stripe's shipping_address_collection.allowed_countries.
export const SHIPPING_COUNTRIES = [
  // Netherlands
  { code: "NL", name: "Netherlands", zone: "nl" },

  // Rest of Europe (EU/EEA + UK + Switzerland)
  { code: "AT", name: "Austria", zone: "eu" },
  { code: "BE", name: "Belgium", zone: "eu" },
  { code: "BG", name: "Bulgaria", zone: "eu" },
  { code: "HR", name: "Croatia", zone: "eu" },
  { code: "CY", name: "Cyprus", zone: "eu" },
  { code: "CZ", name: "Czechia", zone: "eu" },
  { code: "DK", name: "Denmark", zone: "eu" },
  { code: "EE", name: "Estonia", zone: "eu" },
  { code: "FI", name: "Finland", zone: "eu" },
  { code: "FR", name: "France", zone: "eu" },
  { code: "DE", name: "Germany", zone: "eu" },
  { code: "GR", name: "Greece", zone: "eu" },
  { code: "HU", name: "Hungary", zone: "eu" },
  { code: "IE", name: "Ireland", zone: "eu" },
  { code: "IT", name: "Italy", zone: "eu" },
  { code: "LV", name: "Latvia", zone: "eu" },
  { code: "LT", name: "Lithuania", zone: "eu" },
  { code: "LU", name: "Luxembourg", zone: "eu" },
  { code: "MT", name: "Malta", zone: "eu" },
  { code: "NO", name: "Norway", zone: "eu" },
  { code: "PL", name: "Poland", zone: "eu" },
  { code: "PT", name: "Portugal", zone: "eu" },
  { code: "RO", name: "Romania", zone: "eu" },
  { code: "SK", name: "Slovakia", zone: "eu" },
  { code: "SI", name: "Slovenia", zone: "eu" },
  { code: "ES", name: "Spain", zone: "eu" },
  { code: "SE", name: "Sweden", zone: "eu" },
  { code: "CH", name: "Switzerland", zone: "eu" },
  { code: "GB", name: "United Kingdom", zone: "eu" },

  // Rest of world
  { code: "AU", name: "Australia", zone: "world" },
  { code: "CA", name: "Canada", zone: "world" },
  { code: "JP", name: "Japan", zone: "world" },
  { code: "NZ", name: "New Zealand", zone: "world" },
  { code: "US", name: "United States", zone: "world" },
];

// All shippable country codes — for Stripe's allowed_countries when no specific
// country has been chosen yet (kept for completeness; checkout locks to one).
export const ALLOWED_COUNTRIES = SHIPPING_COUNTRIES.map((c) => c.code);

export function zoneForCountry(code) {
  return SHIPPING_COUNTRIES.find((c) => c.code === code)?.zone ?? null;
}

/*
  Resolve the shipping line for a destination + cart subtotal. Returns null when
  the country is not one we ship to (so the caller can refuse / prompt). The
  free-over-threshold is applied here, once, from the subtotal.
*/
export function shippingForCountry(code, subtotal) {
  const zoneKey = zoneForCountry(code);
  if (!zoneKey) return null;
  const z = ZONES[zoneKey];
  const free = z.freeOver != null && subtotal >= z.freeOver;
  return {
    zone: zoneKey,
    label: z.label,
    cost: free ? 0 : z.base,
    free,
    freeOver: z.freeOver,
    minDays: z.minDays,
    maxDays: z.maxDays,
  };
}
