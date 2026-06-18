"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { getAllArtworks } from "@/lib/db";
import { getFirstImageUrl } from "@/lib/storage";

const CATEGORIES = [
  {
    href: "/portfolio/oil-paintings",
    label: "Oil Paintings",
    description: "Original oil paintings on canvas and board",
    filter: "oil",
  },
  {
    href: "/portfolio/digital-art",
    label: "Digital Art",
    description: "Digital illustrations and paintings",
    filter: "digital",
  },
  {
    href: "/portfolio/sketches",
    label: "Sketches",
    description: "Pencil, ink, and mixed media sketches",
    filter: "sketch",
  },
];

export default function PortfolioPage() {
  const [previews, setPreviews] = useState({});

  useEffect(() => {
    async function load() {
      const all = await getAllArtworks();
      const result = {};
      for (const cat of CATEGORIES) {
        const first = all.find((a) => a.category === cat.filter);
        if (first?.originalFolder) {
          result[cat.filter] = await getFirstImageUrl(first.originalFolder);
        }
      }
      setPreviews(result);
    }
    load();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl text-[var(--color-accent)]" style={{ fontFamily: "var(--font-fraunces)" }}>Portfolio</h1>
        <p className="mt-4 text-gray-600 max-w-xl mx-auto">
          Browse Anne&apos;s collection across three distinct styles.
        </p>
      </div>

      <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-8">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.href}
            href={cat.href}
            className="group flex flex-col rounded-2xl overflow-hidden art-frame hover:border-[#a06868] hover:shadow-lg transition-all"
          >
            <div className="aspect-square overflow-hidden bg-gray-100 relative">
              {previews[cat.filter] && (
                <Image
                  src={previews[cat.filter]}
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
                View collection &rarr;
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
