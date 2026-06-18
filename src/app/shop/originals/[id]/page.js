"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { getArtworkById } from "@/lib/db";
import { getImagesFromFolder } from "@/lib/storage";
import { useCart } from "@/context/CartContext";
import ImageZoom from "@/components/ImageZoom";
import ThumbnailStrip from "@/components/ThumbnailStrip";
import TrustStrip from "@/components/TrustStrip";
import MoreLikeThis from "@/components/MoreLikeThis";

export default function OriginalProductPage({ params }) {
  const { id } = use(params);
  const [artwork, setArtwork] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [added, setAdded] = useState(false);
  const { addToCart } = useCart();

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

  useEffect(() => {
    if (!added) return;
    const t = setTimeout(() => setAdded(false), 2000);
    return () => clearTimeout(t);
  }, [added]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="h-96 flex items-center justify-center text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!artwork || !artwork.original) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Not Found</h1>
        <Link href="/shop/originals" className="mt-6 inline-block text-sm font-medium site-btn px-4 py-1.5">
          &larr; Originals
        </Link>
      </div>
    );
  }

  function handleAddToCart() {
    addToCart(artwork, "original", artwork.original.price, null, null, images[selectedImage]);
    setAdded(true);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link href="/shop/originals" className="text-sm font-medium site-btn px-4 py-1.5 inline-block">
        &larr; Originals
      </Link>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div>
          <ImageZoom
            src={images[selectedImage]}
            alt={artwork.title}
            className="rounded-2xl aspect-square"
          />
          <ThumbnailStrip images={images} selectedIndex={selectedImage} onSelect={setSelectedImage} />
        </div>

        <div className="flex flex-col">
          <h1 className="text-2xl sm:text-3xl text-[var(--color-accent)]" style={{ fontFamily: "var(--font-fraunces)" }}>{artwork.title}</h1>
          <p className="mt-1 text-gray-500">{artwork.medium} - {artwork.year}</p>
          <p className="mt-0.5 text-sm text-gray-400">{artwork.dimensions}</p>
          <p className="mt-6 text-gray-700 leading-relaxed">{artwork.description}</p>
          <p className="mt-3 text-sm text-gray-400">One of a kind · {artwork.dimensions}</p>

          {artwork.original.available ? (
            <div className="mt-6 flex flex-col gap-4">
              <p className="text-2xl font-bold text-gray-900">€{artwork.original.price}</p>
              <button
                onClick={handleAddToCart}
                className="px-8 py-3 text-sm font-medium site-btn-active self-start"
              >
                {added ? "Added to Cart ✓" : "Add to Cart"}
              </button>
            </div>
          ) : (
            <div className="mt-6 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <p className="text-2xl font-bold text-gray-400">€{artwork.original.price}</p>
                <span className="px-3 py-1 rounded-full bg-[var(--color-accent)] text-white text-xs font-semibold uppercase tracking-wide">
                  Sold
                </span>
              </div>
              <p className="text-sm text-gray-500">
                This original has found its home. Prints and stickers are still available below.
              </p>
            </div>
          )}

          <TrustStrip />

          <div className="mt-8 pt-6 border-t border-[var(--color-border)]">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Also available</p>
            <div className="flex flex-wrap gap-2">
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
        </div>
      </div>

      <MoreLikeThis
        heading="Shop more originals"
        currentId={artwork.id}
        variant="original"
        type="original"
        hrefBase="/shop/originals"
      />
    </div>
  );
}
