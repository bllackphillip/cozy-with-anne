"use client";

import Image from "next/image";
import Carousel from "./Carousel";

function BannerSlide({ url, alt }) {
  return (
    <Image
      src={url}
      alt={alt}
      width={2400}
      height={1000}
      draggable={false}
      className="w-full h-auto sm:h-[52vh] rounded-none sm:rounded-2xl art-frame sm:object-cover block pointer-events-none"
    />
  );
}

export default function BannerCarousel({ banners, initialIndex = 0 }) {
  const valid = (banners || []).filter(Boolean);
  return (
    <Carousel
      slides={valid}
      initialIndex={initialIndex}
      className="bg-[var(--color-bg)]"
      renderSlide={(b) => <BannerSlide url={b.url} alt={b.alt} />}
    />
  );
}
