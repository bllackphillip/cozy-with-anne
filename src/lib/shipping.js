import { COUNTRY_CODES } from "@/data/countries";

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

  Every shippable country resolves to a zone: Netherlands -> nl, the European set
  below -> eu, and everything else falls back to world. (RU and TR are treated as
  world here; adjust EUROPE_CODES if Anne wants them in the Europe rate.)
*/

export const ZONES = {
  nl: { label: "Netherlands", base: 5, freeOver: 20, minDays: 1, maxDays: 3 },
  eu: { label: "Europe", base: 25, freeOver: 300, minDays: 2, maxDays: 7 },
  world: { label: "Rest of world", base: 50, freeOver: null, minDays: 5, maxDays: 15 },
};

// "Rest of Europe" (excludes NL, which is its own zone): EU + EEA + UK +
// Switzerland + European microstates + the rest of geographic Europe.
export const EUROPE_CODES = new Set([
  // EU (minus NL)
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU",
  "IE", "IT", "LV", "LT", "LU", "MT", "PL", "PT", "RO", "SK", "SI", "ES", "SE",
  // EEA + UK + Switzerland
  "IS", "LI", "NO", "GB", "CH",
  // Microstates
  "AD", "MC", "SM", "VA",
  // Rest of geographic Europe
  "AL", "BA", "ME", "MK", "RS", "XK", "MD", "UA", "BY",
]);

const KNOWN = new Set(COUNTRY_CODES);

export function zoneForCountry(code) {
  if (!code || !KNOWN.has(code)) return null;
  if (code === "NL") return "nl";
  if (EUROPE_CODES.has(code)) return "eu";
  return "world";
}

/*
  Resolve the shipping line for a destination + cart subtotal. Returns null when
  the country is missing/unrecognised (so the caller can refuse / prompt). The
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
