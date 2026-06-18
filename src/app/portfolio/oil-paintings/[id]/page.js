"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { getArtworkById } from "@/lib/db";
import { getImagesFromFolder } from "@/lib/storage";
import ImageZoom from "@/components/ImageZoom";
import ThumbnailStrip from "@/components/ThumbnailStrip";

export default function OilPaintingDetailPage({ params }) {
  const { id } = use(params);
  const [artwork, setArtwork] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    async function load() {
      const art = await getArtworkById(id);
      setArtwork(art);
      if (art?.originalFolder) {
        const imgs = await getImagesFromFolder(art.originalFolder);
        setImages(imgs.map((i) => i.url));
      }
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="h-96 flex items-center justify-center text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!artwork || artwork.category !== "oil") {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Artwork Not Found</h1>
        <Link href="/portfolio/oil-paintings" className="mt-6 inline-block text-sm font-medium site-btn px-4 py-1.5">
          &larr; Oil Paintings
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link href="/portfolio/oil-paintings" className="text-sm font-medium site-btn px-4 py-1.5 inline-block">
        &larr; Oil Paintings
      </Link>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div>
          <ImageZoom
            src={images[selectedImage]}
            alt={artwork.title}
            className="rounded-xl aspect-square"
          />
          <ThumbnailStrip images={images} selectedIndex={selectedImage} onSelect={setSelectedImage} />
        </div>

        <div className="flex flex-col justify-center">
          <h1 className="text-2xl sm:text-3xl text-[var(--color-accent)]" style={{ fontFamily: "var(--font-fraunces)" }}>{artwork.title}</h1>
          <p className="mt-2 text-gray-500">{artwork.medium} - {artwork.year}</p>
          <p className="mt-1 text-sm text-gray-400">{artwork.dimensions}</p>
          <p className="mt-6 text-gray-700 leading-relaxed">{artwork.description}</p>

          <div className="mt-8">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Available in shop</p>
            <div className="flex flex-wrap gap-2">
              {artwork.original?.available && (
                <Link href={`/shop/originals/${artwork.id}`} className="text-xs px-3 py-1.5 rounded-full border border-[var(--color-border-warm)] text-[var(--color-accent)] hover:bg-[var(--color-surface)] transition-colors">
                  Original - €{artwork.original.price}
                </Link>
              )}
              {artwork.original && !artwork.original.available && (
                <span className="text-xs px-3 py-1.5 rounded-full border border-[var(--color-border)] text-gray-400">
                  Original · €{artwork.original.price} · Sold
                </span>
              )}
              {artwork.prints && (
                <Link href={`/shop/prints/${artwork.id}`} className="text-xs px-3 py-1.5 rounded-full border border-[var(--color-border-warm)] text-[var(--color-accent)] hover:bg-[var(--color-surface)] transition-colors">
                  Prints from €{artwork.prints?.sizes?.[0]?.price}
                </Link>
              )}
              {artwork.stickers && (
                <Link href={`/shop/stickers/${artwork.id}`} className="text-xs px-3 py-1.5 rounded-full border border-[var(--color-border-warm)] text-[var(--color-accent)] hover:bg-[var(--color-surface)] transition-colors">
                  Stickers €{artwork.stickers?.size?.price ?? 3}
                </Link>
              )}
            </div>
          </div>

          <div className="mt-6">
            <Link
              href="/portfolio/oil-paintings"
              className="px-8 py-3 text-sm font-medium site-btn-active inline-block text-center"
            >
              Browse More
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
