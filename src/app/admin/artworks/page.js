"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { getAllArtworks, updateArtwork } from "@/lib/db";

/*
  ARTWORKS LIST — the catalogue manager.

  Loads every artwork once, then filters/searches in memory (45 docs, so no
  need to re-query). The featured/availability toggles write straight to
  Firestore with updateArtwork (a partial patch) and optimistically update the
  local row so the UI feels instant.
*/

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "oil", label: "Oil" },
  { id: "digital", label: "Digital" },
  { id: "sketch", label: "Sketch" },
];

export default function ArtworksListPage() {
  const [artworks, setArtworks] = useState(null);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    getAllArtworks()
      .then(setArtworks)
      .catch((err) => {
        console.error(err);
        setError("Could not load artworks.");
      });
  }, []);

  const shown = useMemo(() => {
    if (!artworks) return [];
    const q = search.trim().toLowerCase();
    return artworks
      .filter((a) => filter === "all" || a.category === filter)
      .filter((a) => !q || a.title.toLowerCase().includes(q) || a.id.includes(q));
  }, [artworks, filter, search]);

  async function toggle(artwork, field) {
    const next = !artwork[field];
    // Optimistic update
    setArtworks((prev) => prev.map((a) => (a.id === artwork.id ? { ...a, [field]: next } : a)));
    try {
      await updateArtwork(artwork.id, { [field]: next });
    } catch (err) {
      console.error(err);
      // Roll back on failure
      setArtworks((prev) => prev.map((a) => (a.id === artwork.id ? { ...a, [field]: !next } : a)));
      setError("Could not save that change. Are you still signed in?");
    }
  }

  if (error && !artworks) return <p className="text-red-600">{error}</p>;
  if (!artworks) return <p className="text-gray-400">Loading…</p>;

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl text-[var(--color-accent)]" style={{ fontFamily: "var(--font-fraunces)" }}>Artworks</h1>
          <p className="mt-1 text-gray-500">{artworks.length} pieces in your catalogue.</p>
        </div>
        <Link
          href="/admin/artworks/new"
          className="admin-btn px-4 py-2 text-sm font-medium"
        >
          + Add artwork
        </Link>
      </div>

      <div className="mt-6 flex items-center gap-3 flex-wrap">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setFilter(c.id)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                filter === c.id ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title…"
          className="flex-1 min-w-[160px] rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
        />
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-5 bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
        {shown.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-gray-400">No artworks match.</p>
        ) : (
          shown.map((a) => (
            <div key={a.id} className="px-4 sm:px-5 py-3 flex items-center gap-4">
              <div className="min-w-0 flex-1">
                <Link href={`/admin/artworks/${a.id}`} className="font-medium text-gray-900 hover:underline truncate block">
                  {a.title}
                </Link>
                <p className="text-xs text-gray-400">
                  {a.category}
                  {a.category === "oil" && a.original ? ` · €${a.original.price}` : ""}
                  {a.original && a.original.available === false ? " · sold" : ""}
                </p>
              </div>

              <button
                onClick={() => toggle(a, "featured")}
                title="Toggle featured"
                className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${
                  a.featured ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-400 hover:text-gray-600"
                }`}
              >
                {a.featured ? "★ Featured" : "☆ Feature"}
              </button>

              <Link
                href={`/admin/artworks/${a.id}`}
                className="shrink-0 text-sm text-gray-500 hover:text-gray-900"
              >
                Edit →
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
