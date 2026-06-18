"use client";

import { TESTIMONIALS } from "@/data/testimonials";
import Carousel from "@/components/Carousel";

/*
  SOCIAL PROOF — "Kind words" testimonials section.

  Dissertation grounding: Wang et al. (2022) on social proof in independent
  e-commerce, and Li et al. (2014) on social cues / social presence as a trust
  driver. McKnight Benevolence + Integrity: real buyers vouching for a real
  seller. Every quote is genuine (see src/data/testimonials.js).

  Layout (count-driven, so it scales as Anne adds testimonials):
  - Mobile (<768px): always the shared <Carousel>, opened centred on the middle
    card with the neighbours peeking in.
  - Desktop (>=768px): a static single row while the count fits in a row
    (<= DESKTOP_MAX_PER_ROW); beyond that it becomes the same <Carousel>
    (about three visible at a time, centred, with arrows + dots).
  Both carousels open on Math.floor(n/2), so the middle item of the data is the
  featured/centred one.

  Renders NOTHING when there are no real testimonials, so it is always safe to
  ship before content lands. All colours are theme tokens (adapts across palettes).
*/

const DESKTOP_MAX_PER_ROW = 3; // cards that fit one desktop row before it scrolls
const DESKTOP_GRID_COLS = {
  1: "md:grid-cols-1",
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
};

function QuoteMark() {
  return (
    <svg
      className="w-7 h-7 text-[var(--color-accent)] opacity-30"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M9.5 6C6.46 6 4 8.46 4 11.5V18h6.5v-6.5H7.5C7.5 9.57 8.4 8.5 10 8.5V6h-.5Zm10 0C16.46 6 14 8.46 14 11.5V18h6.5v-6.5h-3C17.5 9.57 18.4 8.5 20 8.5V6h-.5Z" />
    </svg>
  );
}

function TestimonialCard({ quote, author, context, location, source }) {
  const meta = [context, location].filter(Boolean).join(" · ");
  return (
    <figure className="w-full h-full flex flex-col rounded-2xl art-frame bg-[var(--color-bg)] shadow-sm p-6 text-left">
      <QuoteMark />
      <blockquote className="mt-3 flex-1 text-gray-700 leading-relaxed text-[0.95rem]">
        {quote}
      </blockquote>
      <figcaption className="mt-5">
        <span className="block font-medium text-gray-800">{author}</span>
        {meta && <span className="block text-sm text-gray-500">{meta}</span>}
        {source && (
          <span className="block text-xs text-gray-400 mt-0.5">{source}</span>
        )}
      </figcaption>
    </figure>
  );
}

export default function Testimonials() {
  const total = TESTIMONIALS.length;
  if (total === 0) return null;

  const center = Math.floor(total / 2);
  const desktopOverflows = total > DESKTOP_MAX_PER_ROW;
  const renderSlide = (t) => <TestimonialCard {...t} />;

  return (
    <section className="bg-[var(--color-surface-2)] py-12 sm:py-16 px-6">
      <div className="text-center mb-10">
        <h2
          className="text-3xl sm:text-4xl text-[var(--color-accent)]"
          style={{ fontFamily: "var(--font-fraunces)" }}
        >
          Kind words
        </h2>
        <p className="mt-3 text-gray-600">
          From people who&apos;ve taken a piece of mine home.
        </p>
      </div>

      {/* Desktop: static row while it fits; carousel once it overflows */}
      {desktopOverflows ? (
        <div className="hidden md:block max-w-6xl mx-auto">
          <Carousel
            slides={TESTIMONIALS}
            initialIndex={center}
            slideWidthRatio={0.3}
            slideGapRatio={0.03}
            renderSlide={renderSlide}
          />
        </div>
      ) : (
        <div
          className={`hidden md:grid ${DESKTOP_GRID_COLS[total] || "md:grid-cols-3"} gap-6 max-w-5xl mx-auto items-stretch`}
        >
          {TESTIMONIALS.map((t, i) => (
            <TestimonialCard key={`${t.author}-${i}`} {...t} />
          ))}
        </div>
      )}

      {/* Mobile: always a swipeable carousel, opened centred on the middle card.
          -mx-6 lets it span full width so the neighbours peek past the padding. */}
      <div className="md:hidden -mx-6">
        <Carousel
          slides={TESTIMONIALS}
          initialIndex={center}
          mobileWidthRatio={0.82}
          slideGapRatio={0.04}
          renderSlide={renderSlide}
        />
      </div>
    </section>
  );
}
