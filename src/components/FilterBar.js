"use client";

import { slugifyTag, subjectLabel } from "@/lib/subjects";

/*
  FILTER BAR — search + subject dropdown shared by every portfolio/shop grid.

  Presentational: the active state lives in the grid (via useArtworkFilter, which
  mirrors it to the URL). Options are passed in already ordered, derived from the
  artworks on that page — so a section never offers a subject it doesn't contain.
*/
export default function FilterBar({ subjects, tag, query, onTag, onQuery }) {
  const hasFilter = Boolean(tag) || Boolean(query);

  return (
    <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="w-full sm:max-w-xs">
        <label htmlFor="artwork-search" className="sr-only">
          Search artworks
        </label>
        <input
          id="artwork-search"
          type="search"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Search by title or subject…"
          className="w-full rounded-full border border-[var(--color-border-warm)] bg-[var(--color-surface)] px-5 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
        />
      </div>

      <div className="flex items-center gap-3">
        {subjects.length > 0 && (
          <>
            <label htmlFor="subject-filter" className="sr-only">
              Filter by subject
            </label>
            <select
              id="subject-filter"
              value={tag}
              onChange={(e) => onTag(e.target.value)}
              className="rounded-full border border-[var(--color-border-warm)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            >
              <option value="">All artworks</option>
              {subjects.map((s) => (
                <option key={s} value={slugifyTag(s)}>
                  {subjectLabel(s)}
                </option>
              ))}
            </select>
          </>
        )}
        {hasFilter && (
          <button
            type="button"
            onClick={() => {
              onTag("");
              onQuery("");
            }}
            className="text-sm text-gray-500 hover:text-[var(--color-accent)] transition-colors"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
