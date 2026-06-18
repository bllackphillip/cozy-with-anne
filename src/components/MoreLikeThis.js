"use client";

import { useEffect, useState } from "react";
import { getAllArtworks } from "@/lib/db";
import ArtworkCard from "@/components/ArtworkCard";

/*
  MORE LIKE THIS — a small "see more" row at the foot of a detail page. It keeps
  the page from feeling like a dead end, adds internal navigation, and surfaces
  more of the collection (Krug 2014 navigability; Nielsen recognition-over-recall;
  gentle cross-discovery).

  Suggestions are drawn at random from the same kind of work, excluding the piece
  you're on, and re-shuffle on each visit. `variant` picks the pool:
    oil | digital | sketch  → that portfolio category
    original                → oil pieces sold as originals
    print | sticker         → pieces available as prints / stickers
  `type` tells ArtworkCard which image folder to show, and `hrefBase` is the
  route each card links to.
*/

function inPool(artwork, variant) {
  switch (variant) {
    case "oil":
    case "digital":
    case "sketch":
      return artwork.category === variant;
    case "original":
      return !!artwork.original;
    case "print":
      return !!artwork.prints;
    case "sticker":
      return !!artwork.stickers;
    default:
      return false;
  }
}

// Fisher–Yates shuffle, then take the first n.
function pickRandom(items, n) {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
}

export default function MoreLikeThis({
  heading,
  currentId,
  variant,
  type = "original",
  hrefBase,
  count = 5,
}) {
  const [picks, setPicks] = useState([]);

  useEffect(() => {
    let active = true;
    getAllArtworks().then((all) => {
      if (!active) return;
      const pool = all.filter((a) => a.id !== currentId && inPool(a, variant));
      setPicks(pickRandom(pool, count));
    });
    return () => {
      active = false;
    };
  }, [currentId, variant, count]);

  if (picks.length === 0) return null;

  return (
    <section className="mt-16 pt-10 border-t border-[var(--color-border)]">
      <h2
        className="text-xl sm:text-2xl text-[var(--color-accent)] mb-6 text-center"
        style={{ fontFamily: "var(--font-fraunces)" }}
      >
        {heading}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {picks.map((art) => (
          <ArtworkCard
            key={art.id}
            artwork={art}
            type={type}
            href={`${hrefBase}/${art.id}`}
          >
            <h3 className="text-xs font-semibold text-gray-900 truncate text-center">{art.title}</h3>
            <p className="text-xs text-gray-500 truncate text-center">{art.medium}</p>
          </ArtworkCard>
        ))}
      </div>
    </section>
  );
}
