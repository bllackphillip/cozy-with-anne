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

export default function OriginalsPage() {
  const [paintings, setPaintings] = useState([]);
  const [loading, setLoading] = useState(true);
  const { tag, query, changeTag, changeQuery } = useArtworkFilter();
  const { visible, setVisible, rememberCard } = useGridRestore(`shop-originals:${tag}:${query}`, PAGE_SIZE, !loading);

  const subjects = collectSubjects(paintings);
  const filtered = filterArtworks(paintings, tag, query);

  useEffect(() => {
    getShopItems().then((items) => {
      setPaintings(items.filter((i) => i.category === "oil"));
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
        <h1 className="text-2xl sm:text-3xl text-[var(--color-accent)]" style={{ fontFamily: "var(--font-fraunces)" }}>Original Paintings</h1>
        <p className="mt-4 text-gray-600 max-w-xl mx-auto">
          One-of-a-kind oil paintings - own a unique piece of Anne&apos;s work.
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
                    type="original"
                    href={`/shop/originals/${item.id}`}
                    onClick={() => rememberCard(item.id)}
                  >
                    <h3 className="text-sm font-semibold text-gray-900 group-hover:text-gray-600 transition-colors">{item.title}</h3>
                    <p className="text-sm text-gray-500">{item.medium}</p>
                    <div className="mt-1">
                      {item.original?.available ? (
                        <p className="text-base font-semibold text-gray-900">€{item.original.price}</p>
                      ) : (
                        <p className="text-sm">
                          <span className="font-semibold text-gray-400">€{item.original?.price}</span>
                          <span className="ml-2 font-medium text-[var(--color-accent)]">Sold</span>
                        </p>
                      )}
                    </div>
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
