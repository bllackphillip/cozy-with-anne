"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { getImagesFromFolder } from "@/lib/storage";

function getCardFolder(artwork, type) {
  if (type === "print") return artwork.printsFolder;
  if (type === "sticker") return artwork.stickersFolder;
  return artwork.originalFolder;
}

export default function ArtworkCard({ artwork, type = "original", href, onClick, id, children }) {
  const [cardImage, setCardImage] = useState(null);
  const [hoverImage, setHoverImage] = useState(null);

  const folder = getCardFolder(artwork, type);

  useEffect(() => {
    if (!folder) return;

    getImagesFromFolder(folder).then((imgs) => {
      if (type === "sticker") {
        const bgImg = imgs.find((i) => i.name.toLowerCase().startsWith("bg-"));
        const noBgImg = imgs.find((i) => i.name.toLowerCase().startsWith("no-bg-"));
        if (bgImg) setCardImage(bgImg.url);
        if (noBgImg) setHoverImage(noBgImg.url);
      } else {
        if (imgs[0]) setCardImage(imgs[0].url);
        if (imgs[1]) setHoverImage(imgs[1].url);
      }
    });
  }, [folder, type]);

  return (
    <Link id={id} href={href} onClick={onClick} className="group transition-transform duration-300 hover:scale-[1.02] block">
      <div className="overflow-hidden rounded-xl bg-gray-100 art-frame">
        <div className="aspect-square relative overflow-hidden">
          {cardImage && (
            <Image
              src={cardImage}
              alt={artwork.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover"
            />
          )}
          {hoverImage && (
            <Image
              src={hoverImage}
              alt={artwork.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            />
          )}
        </div>
      </div>
      {children && <div className="mt-3">{children}</div>}
    </Link>
  );
}
