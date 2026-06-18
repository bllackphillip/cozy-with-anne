"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { getAllArtworks } from "@/lib/db";
import { getFirstImageUrl } from "@/lib/storage";
import CommissionCTA from "@/components/CommissionCTA";

export default function ShopPage() {
  const [previews, setPreviews] = useState({});

  useEffect(() => {
    async function load() {
      const all = await getAllArtworks();
      const oilArtwork = all.find((a) => a.category === "oil");
      const digitalArtwork = all.find((a) => a.category === "digital");
      const result = {};
      if (oilArtwork?.originalFolder) {
        result.originals = await getFirstImageUrl(oilArtwork.originalFolder);
        result.prints = oilArtwork.printsFolder
          ? await getFirstImageUrl(oilArtwork.printsFolder)
          : result.originals;
        result.stickers = oilArtwork.stickersFolder
          ? await getFirstImageUrl(`${oilArtwork.stickersFolder}/bg-1.jpg`.replace("/bg-1.jpg", ""))
          : result.originals;
      }
      if (digitalArtwork?.printsFolder && !result.prints) {
        result.prints = await getFirstImageUrl(digitalArtwork.printsFolder);
      }
      setPreviews(result);
    }
    load();
  }, []);

  const categories = [
    {
      key: "originals",
      href: "/shop/originals",
      label: "Original Paintings",
      description: "One-of-a-kind oil paintings - own a piece of Anne's work",
    },
    {
      key: "prints",
      href: "/shop/prints",
      label: "Prints",
      description: "Archival-quality prints in four sizes, Matte or Glossy",
    },
    {
      key: "stickers",
      href: "/shop/stickers",
      label: "Stickers",
      description: "Vinyl die-cut stickers - weatherproof and vibrant",
    },
  ];

  return (
    <div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl text-[var(--color-accent)]" style={{ fontFamily: "var(--font-fraunces)" }}>Shop</h1>
          <p className="mt-4 text-gray-600 max-w-xl mx-auto">
            Original paintings, high-quality prints, and stickers - all made with{" "}
            <span style={{ fontFamily: "var(--font-dancing)", fontSize: "1.2em" }}>love</span>.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-8">
          {categories.map((cat) => (
            <Link
              key={cat.href}
              href={cat.href}
              className="group flex flex-col rounded-2xl overflow-hidden art-frame hover:border-[#a06868] hover:shadow-lg transition-all"
            >
              <div className="aspect-square overflow-hidden bg-gray-100 relative">
                {previews[cat.key] && (
                  <Image
                    src={previews[cat.key]}
                    alt={cat.label}
                    fill
                    sizes="(max-width: 640px) 100vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                )}
              </div>
              <div className="p-6 flex flex-col flex-1">
                <h2 className="text-lg font-semibold text-gray-900">{cat.label}</h2>
                <p className="mt-1 text-sm text-gray-500">{cat.description}</p>
                <span className="mt-4 text-sm font-medium text-[var(--color-accent)] group-hover:underline">
                  Shop now &rarr;
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <CommissionCTA />
    </div>
  );
}
