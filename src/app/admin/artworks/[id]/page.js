"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { getArtworkById } from "@/lib/db";
import ArtworkForm from "@/components/admin/ArtworkForm";

/*
  EDIT ARTWORK

  Next.js 15 passes `params` as a promise, so we unwrap it with use(params).
  `artwork` is tri-state: undefined while loading, null if the id doesn't exist,
  otherwise the document handed to the shared ArtworkForm in edit mode.
*/

export default function EditArtworkPage({ params }) {
  const { id } = use(params);
  const [artwork, setArtwork] = useState(undefined);

  useEffect(() => {
    getArtworkById(id)
      .then((doc) => setArtwork(doc ?? null))
      .catch(() => setArtwork(null));
  }, [id]);

  return (
    <div>
      <Link href="/admin/artworks" className="text-sm text-gray-500 hover:text-gray-800">
        ← Artworks
      </Link>

      {artwork === undefined ? (
        <p className="mt-6 text-gray-400">Loading…</p>
      ) : artwork === null ? (
        <p className="mt-6 text-gray-500">
          No artwork found with the ID <span className="font-mono">{id}</span>.
        </p>
      ) : (
        <>
          <h1 className="mt-3 text-2xl text-[var(--color-accent)]" style={{ fontFamily: "var(--font-fraunces)" }}>Edit “{artwork.title}”</h1>
          <p className="mt-1 mb-6 text-sm text-gray-400 font-mono">{artwork.id}</p>
          <ArtworkForm mode="edit" initial={artwork} />
        </>
      )}
    </div>
  );
}
