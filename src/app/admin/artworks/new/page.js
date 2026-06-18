"use client";

import Link from "next/link";
import ArtworkForm from "@/components/admin/ArtworkForm";

export default function NewArtworkPage() {
  return (
    <div>
      <Link href="/admin/artworks" className="text-sm text-gray-500 hover:text-gray-800">
        ← Artworks
      </Link>
      <h1 className="mt-3 mb-6 text-2xl text-[var(--color-accent)]" style={{ fontFamily: "var(--font-fraunces)" }}>Add a new artwork</h1>
      <ArtworkForm mode="create" />
    </div>
  );
}
