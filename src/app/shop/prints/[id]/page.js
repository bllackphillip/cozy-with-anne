"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { getArtworkById } from "@/lib/db";
import { getImagesFromFolder } from "@/lib/storage";
import { useCart } from "@/context/CartContext";
import ImageZoom from "@/components/ImageZoom";
import ThumbnailStrip from "@/components/ThumbnailStrip";
import TrustStrip from "@/components/TrustStrip";

export default function PrintProductPage({ params }) {
  const { id } = use(params);
  const [artwork, setArtwork] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedFinish, setSelectedFinish] = useState("Matte");
  const [added, setAdded] = useState(false);
  const { addToCart } = useCart();

  useEffect(() => {
    async function load() {
      const art = await getArtworkById(id);
      setArtwork(art);
      if (art?.printsFolder) {
        const imgs = await getImagesFromFolder(art.printsFolder);
        const urls = imgs.map((i) => i.url);
        // inject print size reference as 3rd slide
        const gallery = [
          ...urls.slice(0, 2),
          "/print-size-reference.jpg",
          ...urls.slice(2),
        ];
        setImages(gallery);
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

  if (!artwork || !artwork.prints) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Not Found</h1>
        <Link href="/shop/prints" className="mt-6 inline-block text-sm font-medium site-btn px-4 py-1.5">
          &larr; Prints
        </Link>
      </div>
    );
  }

  const currentSize = selectedSize ?? artwork.prints?.sizes?.[0];

  function handleAddToCart() {
    addToCart(artwork, "print", currentSize.price, currentSize.label, selectedFinish, images[selectedImage]);
    setAdded(true);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link href="/shop/prints" className="text-sm font-medium site-btn px-4 py-1.5 inline-block">
        &larr; Prints
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

          <div className="mt-8 flex flex-col gap-5">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Size</p>
              <div className="flex flex-wrap gap-2">
                {artwork.prints.sizes.map((size) => (
                  <button
                    key={size.label}
                    onClick={() => setSelectedSize(size)}
                    className={`px-4 py-2 text-sm rounded-full border transition-all ${
                      currentSize.label === size.label
                        ? "bg-[var(--color-accent)] text-[var(--color-bg)] border-[var(--color-accent)]"
                        : "bg-[var(--color-surface)] text-[var(--color-accent)] border-[var(--color-border-warm)] hover:border-[var(--color-accent)]"
                    }`}
                  >
                    {size.label} - €{size.price}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Finish</p>
              <div className="flex gap-2">
                {artwork.prints.finishes.map((finish) => (
                  <button
                    key={finish}
                    onClick={() => setSelectedFinish(finish)}
                    className={`px-4 py-2 text-sm rounded-full border transition-all ${
                      selectedFinish === finish
                        ? "bg-[var(--color-accent)] text-[var(--color-bg)] border-[var(--color-accent)]"
                        : "bg-[var(--color-surface)] text-[var(--color-accent)] border-[var(--color-border-warm)] hover:border-[var(--color-accent)]"
                    }`}
                  >
                    {finish}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleAddToCart}
              className="px-8 py-3 text-sm font-medium site-btn-active self-start"
            >
              {added ? "Added to Cart ✓" : `Add to Cart - €${currentSize.price}`}
            </button>
          </div>

          <TrustStrip />

          <div className="mt-8 pt-6 border-t border-[var(--color-border)]">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Also available</p>
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
              {artwork.stickers && (
                <Link href={`/shop/stickers/${artwork.id}`} className="text-xs px-3 py-1.5 rounded-full border border-[var(--color-border-warm)] text-[var(--color-accent)] hover:bg-[var(--color-surface)] transition-colors">
                  Stickers €{artwork.stickers?.size?.price ?? 3}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
