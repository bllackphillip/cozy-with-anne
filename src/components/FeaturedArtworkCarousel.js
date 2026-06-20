"use client";

import ArtworkCard from "./ArtworkCard";
import Carousel from "./Carousel";

export default function FeaturedArtworkCarousel({ artworks }) {
  return (
    <Carousel
      slides={artworks}
      initialIndex={Math.floor(artworks.length / 2)}
      slideWidthRatio={0.34}
      mobileWidthRatio={0.82}
      innerClassName="max-w-6xl mx-auto"
      renderSlide={(artwork) => (
        <ArtworkCard
          artwork={artwork}
          href={artwork.portfolioPath}
        >
          <p className="text-center text-sm text-[#4a2e2e] font-medium">
            {artwork.title}
          </p>
        </ArtworkCard>
      )}
    />
  );
}
