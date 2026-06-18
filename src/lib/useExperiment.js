"use client";
import { useEffect, useState } from "react";

/*
  EXPERIMENT VARIANT HOOK — drives the dissertation's within-session experiments
  (§4.6). Each experiment has a DEFAULT variant equal to current production, so
  ordinary visitors are unaffected. A researcher activates an alternate by
  appending a URL param (e.g. ?expA=generic). The choice is persisted to
  localStorage so it survives navigation and the Stripe redirect (needed for the
  post-purchase experiment A, whose result page is a fresh load with no param).
  The global <ExperimentSync> (mounted in the root layout) captures the param on
  ANY page, so a variant set before checkout is still active on /order/success.

  SSR-safe: returns the default on the server and the first client paint, then
  reconciles after mount inside requestAnimationFrame (so the setState is not
  synchronous in the effect body — react-hooks/set-state-in-effect), matching the
  pattern in useArtworkFilter.js.

  Experiments:
    A — order-confirmation copy:       "warm"  (default) | "generic"
    B — commission progress promise:   "on"    (default) | "off"
    D — security signals (TrustStrip): "shown" (default) | "hidden"
  (C — palette agency — is provided by the existing ThemeSwitcher, no toggle.)
*/

const STORAGE_KEY = "cwa-exp";
const PARAMS = { A: "expA", B: "expB", D: "expD" };

function readStored() {
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

// Capture any experiment params currently in the URL into localStorage, so a
// variant chosen on one page persists across navigation and the Stripe redirect.
// Returns the merged map. Safe to call on any page (no-op server-side).
export function syncExperimentsFromUrl() {
  if (typeof window === "undefined") return {};
  const stored = readStored();
  try {
    const url = new URLSearchParams(window.location.search);
    let changed = false;
    for (const [key, param] of Object.entries(PARAMS)) {
      const v = url.get(param);
      if (v && stored[key] !== v) {
        stored[key] = v;
        changed = true;
      }
    }
    if (changed) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    }
  } catch {
    // ignore storage/URL failures — defaults still apply
  }
  return stored;
}

export function useExperiment(key, defaultVariant) {
  const [variant, setVariant] = useState(defaultVariant);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const merged = syncExperimentsFromUrl();
      setVariant(merged[key] || defaultVariant);
    });
    return () => cancelAnimationFrame(frame);
  }, [key, defaultVariant]);

  return variant;
}
