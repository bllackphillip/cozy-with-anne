"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { getArtworkById } from "@/lib/db";
import { getImagesFromFolder } from "@/lib/storage";
import { useCart } from "@/context/CartContext";
import ImageZoom from "@/components/ImageZoom";
import ThumbnailStrip from "@/components/ThumbnailStrip";
import TrustStrip from "@/components/TrustStrip";

// Fallback only — the real size/price is read from the artwork's Firebase data.
const DEFAULT_STICKER_SIZE = { label: "7 cm", price: 3 };

export default function StickerProductPage({ params }) {
  const { id } = use(params);
  const [artwork, setArtwork] = useState(null);
  const [images, setImages] = useState([]);
  const [stickerOptions, setStickerOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedBackground, setSelectedBackground] = useState(null);
  const [added, setAdded] = useState(false);
  const { addToCart } = useCart();

  useEffect(() => {
    async function load() {
      const art = await getArtworkById(id);
      setArtwork(art);
      if (art?.stickersFolder) {
        const imgs = await getImagesFromFolder(art.stickersFolder);
        setImages(imgs);

        const bgImgs = imgs.filter((i) => i.name.startsWith("bg-"));
        const noBgImgs = imgs.filter((i) => i.name.startsWith("no-bg-"));

        const options = [
          ...bgImgs.map((img, idx) => ({
            label: bgImgs.length === 1 ? "With background" : `With background ${idx + 1}`,
            imgIndex: imgs.findIndex((i) => i.name === img.name),
          })),
          ...noBgImgs.map((img, idx) => ({
            label: noBgImgs.length === 1 ? "Backgroundless" : `Backgroundless ${idx + 1}`,
            imgIndex: imgs.findIndex((i) => i.name === img.name),
          })),
        ];

        setStickerOptions(options);
        if (options.length > 0) {
          setSelectedBackground(options[0].label);
          setSelectedImage(options[0].imgIndex >= 0 ? options[0].imgIndex : 0);
        }
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

  if (!artwork || !artwork.stickers) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Not Found</h1>
        <Link href="/shop/stickers" className="mt-6 inline-block text-sm font-medium site-btn px-4 py-1.5">
          &larr; Stickers
        </Link>
      </div>
    );
  }

  const stickerSize = artwork?.stickers?.size ?? DEFAULT_STICKER_SIZE;

  function handleAddToCart() {
    addToCart(artwork, "sticker", stickerSize.price, stickerSize.label, selectedBackground, images[selectedImage]?.url);
    setAdded(true);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link href="/shop/stickers" className="text-sm font-medium site-btn px-4 py-1.5 inline-block">
        &larr; Stickers
      </Link>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div>
          <ImageZoom
            src={images[selectedImage]?.url}
            alt={artwork.title}
            className="rounded-2xl aspect-square"
          />
          <ThumbnailStrip
            images={images}
            selectedIndex={selectedImage}
            onSelect={(i) => {
              setSelectedImage(i);
              const match = stickerOptions.find((o) => o.imgIndex === i);
              if (match) setSelectedBackground(match.label);
            }}
          />
        </div>

        <div className="flex flex-col">
          <h1 className="text-2xl sm:text-3xl text-[var(--color-accent)]" style={{ fontFamily: "var(--font-fraunces)" }}>{artwork.title}</h1>
          <p className="mt-1 text-gray-500">{artwork.medium} - {artwork.year}</p>

          <div className="mt-8 flex flex-col gap-5">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Size</p>
              <p className="text-sm text-gray-600">{stickerSize.label}</p>
            </div>

            {stickerOptions.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Background</p>
                <div className="flex flex-wrap gap-2">
                  {stickerOptions.map((option) => (
                    <button
                      key={option.label}
                      onClick={() => {
                        setSelectedBackground(option.label);
                        setSelectedImage(option.imgIndex >= 0 ? option.imgIndex : 0);
                      }}
                      className={`px-4 py-2 text-sm rounded-full border transition-all ${
                        selectedBackground === option.label
                          ? "bg-[var(--color-accent)] text-[var(--color-bg)] border-[var(--color-accent)]"
                          : "bg-[var(--color-surface)] text-[var(--color-accent)] border-[var(--color-border-warm)] hover:border-[var(--color-accent)]"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                  {!stickerOptions.some((o) => o.label.startsWith("Backgroundless")) && (
                    <button
                      disabled
                      className="px-4 py-2 text-sm rounded-full border border-gray-200 text-gray-300 cursor-not-allowed"
                    >
                      No backgroundless sticker available
                    </button>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={handleAddToCart}
              className="px-8 py-3 text-sm font-medium site-btn-active self-start"
            >
              {added ? "Added to Cart ✓" : `Add to Cart - €${stickerSize.price}`}
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
              {artwork.prints && (
                <Link href={`/shop/prints/${artwork.id}`} className="text-xs px-3 py-1.5 rounded-full border border-[var(--color-border-warm)] text-[var(--color-accent)] hover:bg-[var(--color-surface)] transition-colors">
                  Prints from €{artwork.prints?.sizes?.[0]?.price}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
