"use client";

import { useState, useRef, useCallback, useEffect } from "react";
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
  Refs track the latest values so each setter can sync the URL without a stale
  closure.
*/
function readParam(name) {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get(name) ?? "";
}

export function useArtworkFilter() {
  const router = useRouter();
  const pathname = usePathname();

  const [tag, setTag] = useState(() => readParam("tag"));
  const [query, setQuery] = useState(() => readParam("q"));
  const tagRef = useRef(tag);
  const queryRef = useRef(query);

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
      tagRef.current = next;
      setTag(next);
      sync(next, queryRef.current);
    },
    [sync]
  );

  const changeQuery = useCallback(
    (next) => {
      queryRef.current = next;
      setQuery(next);
      sync(tagRef.current, next);
    },
    [sync]
  );

  // Re-sync from the URL whenever the route changes. Client navigation between
  // grids (e.g. the Portfolio dropdown: oil -> sketches) can leave
  // window.location momentarily stale when the lazy initialisers above run, so
  // the previous grid's filter would otherwise persist and silently filter the
  // new grid down to nothing. `pathname` only changes on a real route change,
  // never when changeTag/changeQuery update the query string, so this never
  // clobbers a filter the user just applied.
  useEffect(() => {
    const t = readParam("tag");
    const q = readParam("q");
    tagRef.current = t;
    queryRef.current = q;
    setTag(t);
    setQuery(q);
  }, [pathname]);

  return { tag, query, changeTag, changeQuery };
}
