"use client";

import { useState, useEffect, useRef, useCallback } from "react";

/*
  useGridRestore — keeps a paginated grid's place across navigation.

  Problem it solves: the grids fetch on mount and reset "Load More" to the first
  page, so opening an artwork then pressing Back dropped you at the top with only
  6 cards. This persists the loaded count per route and remembers which card you
  opened, so returning scrolls that exact card back into view.

  - key      : a stable per-view id, e.g. "portfolio-oil" — include the active
               filter in it (e.g. "portfolio-oil:fruits:berries") so changing the
               filter starts a fresh page count, and returning to a filter view
               restores its own count.
  - pageSize : initial count / Load More increment
  - ready    : flips true once the cards have rendered (e.g. !loading), which is
               when it's safe to scroll the remembered card into view

  Returns { visible, setVisible, rememberCard }. Call rememberCard(id) from each
  card's onClick; give each card an element id of `card-<id>` so it can be found.
*/
export function useGridRestore(key, pageSize, ready) {
  const visKey = `grid:${key}:visible`;
  const cardKey = `grid:${key}:card`;

  const readVisible = () => {
    if (typeof window === "undefined") return pageSize;
    const saved = Number(sessionStorage.getItem(visKey));
    return saved >= pageSize ? saved : pageSize;
  };

  // SSR-safe initial value; the effect below syncs it to the real key on mount
  // (and re-syncs whenever the key changes, e.g. the filter changed).
  const [visible, setVisible] = useState(pageSize);

  const prevVisKey = useRef(null);
  useEffect(() => {
    if (prevVisKey.current === visKey) return;
    prevVisKey.current = visKey;
    setVisible(readVisible());
    // readVisible reads from visKey, which is the effect's only dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visKey]);

  useEffect(() => {
    sessionStorage.setItem(visKey, String(visible));
  }, [visKey, visible]);

  const rememberCard = useCallback(
    (id) => {
      sessionStorage.setItem(cardKey, id);
    },
    [cardKey]
  );

  const restored = useRef(false);
  useEffect(() => {
    if (!ready || restored.current) return;
    restored.current = true;
    const id = sessionStorage.getItem(cardKey);
    if (!id) return;
    sessionStorage.removeItem(cardKey);
    // Wait a frame so the cards are laid out before we scroll.
    requestAnimationFrame(() => {
      const el = document.getElementById(`card-${id}`);
      if (el) el.scrollIntoView({ block: "center" });
    });
  }, [ready, cardKey]);

  return { visible, setVisible, rememberCard };
}
