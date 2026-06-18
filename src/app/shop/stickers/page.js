"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getShopItems } from "@/lib/db";
import ArtworkCard from "@/components/ArtworkCard";
import CommissionCTA from "@/components/CommissionCTA";
import FilterBar from "@/components/FilterBar";
import { useGridRestore } from "@/lib/useGridRestore";
import { useArtworkFilter } from "@/lib/useArtworkFilter";
import { collectSubjects, filterArtworks } from "@/lib/subjects";

const PAGE_SIZE = 6;

export default function StickersPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { tag, query, changeTag, changeQuery } = useArtworkFilter();
  const { visible, setVisible, rememberCard } = useGridRestore(`shop-stickers:${tag}:${query}`, PAGE_SIZE, !loading);

  const subjects = collectSubjects(items);
  const filtered = filterArtworks(items, tag, query);

  useEffect(() => {
    getShopItems().then((data) => {
      setItems(data);
      setLoading(false);
    });
  }, []);

  return (
    <>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link href="/shop" className="text-sm font-medium site-btn px-4 py-1.5 inline-block">
        &larr; Shop
      </Link>

      <div className="mt-6 text-center">
        <h1 className="text-2xl sm:text-3xl text-[var(--color-accent)]" style={{ fontFamily: "var(--font-fraunces)" }}>Stickers</h1>
        <p className="mt-4 text-gray-600 max-w-xl mx-auto">
          Vinyl die-cut stickers - weatherproof and vibrant. With or without background.
        </p>
      </div>

      {loading ? (
        <div className="mt-12 h-64 flex items-center justify-center text-gray-400">Loading...</div>
      ) : (
        <>
          <FilterBar subjects={subjects} tag={tag} query={query} onTag={changeTag} onQuery={changeQuery} />

          {filtered.length === 0 ? (
            <p className="mt-16 text-center text-gray-500">
              No pieces match that search yet - try another word or clear the filter.
            </p>
          ) : (
            <>
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {filtered.slice(0, visible).map((item) => (
                  <ArtworkCard
                    key={item.id}
                    id={`card-${item.id}`}
                    artwork={item}
                    type="sticker"
                    href={`/shop/stickers/${item.id}`}
                    onClick={() => rememberCard(item.id)}
                  >
                    <h3 className="text-sm font-semibold text-gray-900 group-hover:text-gray-600 transition-colors">{item.title}</h3>
                    <p className="text-sm text-gray-500">Sticker · {item.stickers?.size?.label ?? "7 cm"}</p>
                    <p className="mt-1 text-base font-semibold text-gray-900">
                      €{item.stickers?.size?.price ?? 3}
                    </p>
                  </ArtworkCard>
                ))}
              </div>

              {visible < filtered.length ? (
                <div className="mt-12 flex justify-center">
                  <button
                    onClick={() => setVisible((v) => v + PAGE_SIZE)}
                    className="px-8 py-3 text-sm font-medium site-btn"
                  >
                    Load More
                  </button>
                </div>
              ) : (
                <div className="mt-12" />
              )}
            </>
          )}
        </>
      )}
    </div>
    {!loading && visible >= filtered.length && <CommissionCTA />}
    </>
  );
}
