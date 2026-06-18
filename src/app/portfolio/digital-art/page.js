"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getAllArtworks } from "@/lib/db";
import ArtworkCard from "@/components/ArtworkCard";
import EndOfCollection from "@/components/EndOfCollection";
import FilterBar from "@/components/FilterBar";
import { useGridRestore } from "@/lib/useGridRestore";
import { useArtworkFilter } from "@/lib/useArtworkFilter";
import { collectSubjects, filterArtworks } from "@/lib/subjects";

const PAGE_SIZE = 6;

export default function DigitalArtPage() {
  const [digital, setDigital] = useState([]);
  const [loading, setLoading] = useState(true);
  const { tag, query, changeTag, changeQuery } = useArtworkFilter();
  const { visible, setVisible, rememberCard } = useGridRestore(`portfolio-digital:${tag}:${query}`, PAGE_SIZE, !loading);

  const subjects = collectSubjects(digital);
  const filtered = filterArtworks(digital, tag, query);

  useEffect(() => {
    getAllArtworks().then((all) => {
      setDigital(all.filter((a) => a.category === "digital"));
      setLoading(false);
    });
  }, []);

  return (
    <>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link href="/portfolio" className="text-sm font-medium site-btn px-4 py-1.5 inline-block">
        &larr; Portfolio
      </Link>

      <div className="mt-6 text-center">
        <h1 className="text-2xl sm:text-3xl text-[var(--color-accent)]" style={{ fontFamily: "var(--font-fraunces)" }}>Digital Art</h1>
        <p className="mt-4 text-gray-600 max-w-xl mx-auto">Digital illustrations and paintings.</p>
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
                {filtered.slice(0, visible).map((artwork) => (
                  <ArtworkCard
                    key={artwork.id}
                    id={`card-${artwork.id}`}
                    artwork={artwork}
                    type="original"
                    href={`/portfolio/digital-art/${artwork.id}`}
                    onClick={() => rememberCard(artwork.id)}
                  >
                    <h3 className="text-sm font-semibold text-gray-900 group-hover:text-gray-600 transition-colors">{artwork.title}</h3>
                    <p className="text-sm text-gray-500">{artwork.medium}</p>
                    {artwork.prints && (
                      <p className="mt-1 text-xs text-[var(--color-accent)]">Prints &amp; Stickers available</p>
                    )}
                  </ArtworkCard>
                ))}
              </div>

              {visible < filtered.length && (
                <div className="mt-12 flex justify-center">
                  <button
                    onClick={() => setVisible((v) => v + PAGE_SIZE)}
                    className="px-8 py-3 text-sm font-medium site-btn"
                  >
                    Load More
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
    {!loading && filtered.length > 0 && visible >= filtered.length && <EndOfCollection />}
    </>
  );
}
