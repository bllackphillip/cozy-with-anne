"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

/*
  useArtworkFilter — holds the active subject + search and mirrors them in the
  URL (?tag=fruits&q=berries) so the filtered view is shareable and, crucially,
  survives the Back button: opening an artwork then returning remounts the grid,
  the lazy initialisers below re-read the URL, and the same filtered view is
  restored (pairs with useGridRestore's scroll memory).

  We read window.location in the lazy initialisers rather than useSearchParams()
  so no <Suspense> boundary is needed, and there's no hydration mismatch — the
  grid renders its "Loading…" state on first paint regardless of these values.
  Route-keyed state keeps the local filter and URL synchronisation aligned.
*/
function readParam(name) {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get(name) ?? "";
}

function readFilterState(pathname) {
  return {
    pathname,
    tag: readParam("tag"),
    query: readParam("q"),
  };
}

export function useArtworkFilter() {
  const router = useRouter();
  const pathname = usePathname();

  const [filter, setFilter] = useState(() => readFilterState(pathname));

  // A client navigation can reuse this hook instance for the next grid. Reset
  // immediately when the route identity changes. Do not read window.location
  // here: Next can update `pathname` one render before the browser location has
  // discarded the previous grid's query string.
  let current = filter;
  if (filter.pathname !== pathname) {
    current = { pathname, tag: "", query: "" };
    setFilter(current);
  }

  const { tag, query } = current;

  // Once navigation has committed, reconcile with the destination URL. The
  // animation-frame callback both waits out Next's pathname/location timing
  // window and keeps the state update out of the synchronous effect body.
  // This restores an explicitly shared destination such as
  // `/portfolio/sketches?tag=flowers`, while a normal cross-grid navigation
  // remains clear.
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const next = readFilterState(pathname);
      setFilter((prev) => {
        if (
          prev.pathname === next.pathname &&
          prev.tag === next.tag &&
          prev.query === next.query
        ) {
          return prev;
        }
        return next;
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  const sync = useCallback(
    (t, q) => {
      const params = new URLSearchParams();
      if (t) params.set("tag", t);
      if (q.trim()) params.set("q", q.trim());
      const qs = params.toString();
      // replace (not push) so typing doesn't flood the history stack.
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname]
  );

  const changeTag = useCallback(
    (next) => {
      setFilter({ pathname, tag: next, query });
      sync(next, query);
    },
    [pathname, query, sync]
  );

  const changeQuery = useCallback(
    (next) => {
      setFilter({ pathname, tag, query: next });
      sync(tag, next);
    },
    [pathname, tag, sync]
  );

  return { tag, query, changeTag, changeQuery };
}
