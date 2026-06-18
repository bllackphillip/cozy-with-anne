"use client";

import { TESTIMONIALS } from "@/data/testimonials";
import Carousel from "@/components/Carousel";

/*
  SOCIAL PROOF — "Kind words" testimonials section.

  Dissertation grounding: Wang et al. (2022) on social proof in independent
  e-commerce, and Li et al. (2014) on social cues / social presence as a trust
  driver. McKnight Benevolence + Integrity: real buyers vouching for a real
  seller. Every quote is genuine (see src/data/testimonials.js).

  Layout:
  - Desktop (>=768px): a single row of equal-height cards.
  - Mobile (<768px): the shared <Carousel>, opened centred on the middle card
    (initialIndex = Math.floor(n/2)) with the neighbours peeking in — the same
    generic, count-agnostic carousel the commissions banners use.

  Renders NOTHING when there are no real testimonials, so it is always safe to
  ship before content lands. All colours are theme tokens (adapts across palettes).
*/

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
  if (!TESTIMONIALS || TESTIMONIALS.length === 0) return null;

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

      {/* Desktop: one row of equal-height cards */}
      <div className="hidden md:grid grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
        {TESTIMONIALS.map((t, i) => (
          <TestimonialCard key={`${t.author}-${i}`} {...t} />
        ))}
      </div>

      {/* Mobile: swipeable carousel, opened centred on the middle card. The
          -mx-6 lets it span full width so the neighbours peek past the section
          padding. initialIndex scales with the number of testimonials. */}
      <div className="md:hidden -mx-6">
        <Carousel
          slides={TESTIMONIALS}
          initialIndex={Math.floor(TESTIMONIALS.length / 2)}
          mobileWidthRatio={0.82}
          slideGapRatio={0.04}
          renderSlide={(t) => <TestimonialCard {...t} />}
        />
      </div>
    </section>
  );
}
