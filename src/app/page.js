import Link from "next/link";
import HeroTagline from "@/components/HeroTagline";
import HeroLogo from "@/components/HeroLogo";
import AboutSection from "@/components/AboutSection";
import ScrollReveal from "@/components/ScrollReveal";
import FeaturedArtworkCarousel from "@/components/FeaturedArtworkCarousel";
import CommissionsPreview from "@/components/CommissionsPreview";
import { unstable_cache } from "next/cache";
import { getImagesFromFolder } from "@/lib/storage";
import { getFeaturedArtworks, getPortfolioPath } from "@/lib/db";

const getCachedSiteImages = unstable_cache(
  (folder) => getImagesFromFolder(folder),
  ["site-images"],
  { revalidate: 300 }
);

// Driven by the `featured` flag set in the admin dashboard (sorted by the
// per-artwork `featuredOrder`). Cached for 5 minutes, so changes appear on the
// homepage within that window.
const getCachedFeaturedArtworks = unstable_cache(
  () => getFeaturedArtworks(),
  ["featured-artworks"],
  { revalidate: 300 }
);

export default async function Home() {
  const [aboutImages, commissionImages, rawFeatured] = await Promise.all([
    getCachedSiteImages("site/about"),
    getCachedSiteImages("site/commissions"),
    getCachedFeaturedArtworks(),
  ]);
  const commissionBanner = commissionImages.find((img) => img.name === "banner-top.jpg")?.url;

  const featuredArtworks = rawFeatured.map((artwork) => ({
    ...artwork,
    portfolioPath: getPortfolioPath(artwork),
  }));

  return (
    <div className="page-enter">
      {/* Hero Section
          -mt-16 pulls this section 64px upward so it sits behind the sticky header.
          pt-16 adds 64px of top padding to compensate, keeping the content at the
          same visual position. The floral-bg background fills the header area too. */}
      <section className="floral-top relative -mt-16 pt-16 pb-1 sm:pb-2 border-b border-[var(--color-border)] hero-mobile-hide">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-6 sm:pt-10">
          <HeroLogo />
          <HeroTagline />
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/portfolio"
              className="px-8 py-3 text-sm font-medium site-btn"
            >
              Browse Collections
            </Link>
            <Link
              href="/shop"
              className="px-8 py-3 text-sm font-medium site-btn"
            >
              Take Something Home
            </Link>
          </div>
        </div>
      </section>
      {/* Sentinel: moved OUTSIDE the section so it sits at the exact same vertical
          position as the hero's bottom border (not 4px above it inside pb-1 padding).
          IntersectionObserver in Header.js watches this with rootMargin: "-64px" so it
          fires precisely when the hero/featured boundary reaches the header's bottom edge. */}
      <div id="hero-end" />

      {/* About preview section */}
      <AboutSection images={aboutImages} compact />

      {/* Featured Artworks */}
      {featuredArtworks.length > 0 && (
        <ScrollReveal>
          <section className="bg-[var(--color-surface-2)] py-12 sm:py-16">
            <div className="text-center px-6 mb-2">
              <h2
                className="text-3xl sm:text-4xl text-[var(--color-accent)]"
                style={{ fontFamily: "var(--font-fraunces)" }}
              >
                Featured Works
              </h2>
            </div>

            <FeaturedArtworkCarousel artworks={featuredArtworks} />

            <div className="text-center mt-2 pb-4">
              <Link
                href="/portfolio"
                className="inline-block px-8 py-3 text-sm font-medium site-btn"
              >
                Check out my Portfolio
              </Link>
            </div>
          </section>
        </ScrollReveal>
      )}
      {/* Commissions preview */}
      <ScrollReveal>
        <section className="py-12 sm:py-16">
          <div className="text-center px-6 mb-8">
            <h2
              className="text-3xl sm:text-4xl text-[var(--color-accent)]"
              style={{ fontFamily: "var(--font-fraunces)" }}
            >
              Yours from the first brushstroke
            </h2>
          </div>

          <CommissionsPreview bannerUrl={commissionBanner} />
        </section>
      </ScrollReveal>
    </div>
  );
}
