import Image from "next/image";
import {
  MessageCircle,
  Lightbulb,
  PiggyBank,
  PenLine,
  Palette,
  Brush,
  Package,
} from "lucide-react";
import { unstable_cache } from "next/cache";
import { getImagesFromFolder } from "@/lib/storage";

const getCachedCommissionImages = unstable_cache(
  () => getImagesFromFolder("site/commissions"),
  ["commission-images"],
  { revalidate: 300 }
);
import CommissionForm from "@/components/CommissionForm";
import BannerCarousel from "@/components/BannerCarousel";
import { COMMISSIONS_INTRO } from "@/components/CommissionsPreview";

export const metadata = {
  title: "Commissions | Cozy with Anne",
  description:
    "Commission an original oil painting by Anne - made just for you, from idea to finished piece.",
};

const STEPS = [
  {
    icon: MessageCircle,
    number: "01",
    title: "Share your vision",
    desc: (
      <>
        Fill in the{" "}
        <a
          href="#commission-form"
          className="text-[var(--color-accent)] underline underline-offset-2"
        >
          form below
        </a>{" "}
        with your idea, any references you love, and what the piece means to you.
      </>
    ),
  },
  {
    icon: Lightbulb,
    number: "02",
    title: "We plan together",
    desc: "I usually reply within 24 hours or less to talk through size, style and available options.",
  },
  {
    icon: PiggyBank,
    number: "03",
    title: "Confirm the price",
    desc: "Once we've agreed on everything, I'll send a final quote to confirm before any payment.",
  },
  {
    icon: PenLine,
    number: "04",
    title: "Sketch or mock-up",
    desc: "If needed, I'll share a composition sketch so you can see the layout before I begin.",
  },
  {
    icon: Brush,
    secondIcon: Palette,
    number: "05",
    title: "I paint for you",
    desc: "I'll share progress photos as the painting develops, so you can see it come to life.",
  },
  {
    icon: Package,
    number: "06",
    title: "Arrives with care",
    desc: "Once perfect, I securely pack it with recycled materials and ship it safely to its new home, along with some bonus goodies.",
  },
];

const OIL_TIERS = [
  {
    label: "Small",
    dims: "Up to 30 × 30 cm",
    inches: "≈ 12 × 12 in",
    price: "from €50",
  },
  {
    label: "Medium",
    dims: "30 × 30 – 50 × 50 cm",
    inches: "≈ 12 × 12 – 20 × 20 in",
    price: "from €200",
  },
  {
    label: "Large",
    dims: "Anything over 50 × 50 cm",
    inches: "≈ 20 × 20 in+",
    price: "from €350",
  },
];

const DIGITAL_TIERS = [
  {
    label: "Digital (any size)",
    dims: "Digital file only",
    inches: null,
    price: "from €50",
  },
  {
    label: "Digital (file + print)",
    dims: "Up to A3+ - 32.9 × 48.3 cm",
    inches: "≈ 13 × 19 in",
    price: "from €80",
  },
];


function Banner({ url }) {
  if (!url) return null;
  return (
    <div className="flex justify-center bg-[var(--color-bg)] py-4 sm:py-8">
      <Image
        src={url}
        alt="Commission paintings by Anne"
        width={2400}
        height={1000}
        className="w-full h-auto sm:w-auto sm:h-[52vh] rounded-none sm:rounded-2xl shadow-lg art-frame"
      />
    </div>
  );
}

export default async function CommissionsPage() {
  const allImages = await getCachedCommissionImages();
  const bannerTop = allImages.find((img) => img.name === "banner-top.jpg");
  const commissionPairs = allImages.filter((img) => !img.name.startsWith("banner"));

  // Scalable: any banner-bottom*.jpg uploaded to Firebase appears automatically,
  // sorted alphabetically (banner-bottom.jpg → banner-bottom2.jpg → …)
  const bottomBanners = allImages
    .filter((img) => img.name.startsWith("banner-bottom"))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((b) => ({ url: b.url, alt: "Commission paintings by Anne" }));
  const bottomInitialIndex = Math.floor(bottomBanners.length / 2);

  return (
    <div className="page-enter">
      {/* Sticky mobile CTA — disabled: overlaps with palette switcher */}
      {/* <a
        href="#commission-form"
        className="md:hidden fixed bottom-6 right-6 z-40 px-6 py-3 text-sm font-medium site-btn-active"
      >
        Get a Quote →
      </a> */}

      {/* Heading + intro */}
      <div className="pt-10 pb-6 px-6 text-center">
        <h1
          className="text-3xl sm:text-4xl text-[var(--color-accent)]"
          style={{ fontFamily: "var(--font-fraunces)" }}
        >
          Commission a Painting
        </h1>
        <p className="mt-4 text-gray-600 max-w-xl mx-auto leading-relaxed text-base sm:text-lg">
          {COMMISSIONS_INTRO}
        </p>
        <p className="mt-3 text-gray-600 max-w-xl mx-auto leading-relaxed text-base sm:text-lg">
          A portrait of your partner? A sticker with your pet? A cover for your
          book? If you can picture it, we can bring it to life.
        </p>
      </div>

      {/* Top banner collage */}
      <Banner url={bannerTop?.url} />

      {/* How it works */}
      <section className="bg-[var(--color-surface-2)] py-12 sm:py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h2
            className="text-2xl sm:text-3xl text-[var(--color-accent)] text-center mb-10"
            style={{ fontFamily: "var(--font-fraunces)" }}
          >
            How it works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10">
            {STEPS.map((step) => {
              const Icon = step.icon;
              const SecondIcon = step.secondIcon ?? null;
              return (
                <div key={step.number} className="flex flex-col items-center text-center">
                  <div className="flex items-end justify-center gap-3 mb-4">
                    {SecondIcon && (
                      <SecondIcon size={44} strokeWidth={1.25} color="var(--color-accent)" />
                    )}
                    <Icon
                      size={SecondIcon ? 34 : 52}
                      strokeWidth={1.25}
                      color="var(--color-accent)"
                    />
                  </div>
                  <h3 className="font-semibold text-[#4a2e2e] mb-1">
                    {step.number}. {step.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Rough pricing guide */}
      <section className="py-12 sm:py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2
            className="text-2xl sm:text-3xl text-[var(--color-accent)] text-center mb-3"
            style={{ fontFamily: "var(--font-fraunces)" }}
          >
            Rough pricing guide
          </h2>
          <p className="text-center text-sm text-gray-500 mb-10">
            Final price depends on format, complexity and detail. We&apos;ll
            always confirm all the details before I begin the process.
          </p>

          {/* Oil paintings */}
          <div className="mb-10">
            <h3 className="text-xs font-semibold text-[#4a2e2e] mb-4 text-center tracking-wide uppercase">
              Oil paintings
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {OIL_TIERS.map((tier) => (
                <div
                  key={tier.label}
                  className="rounded-2xl border border-[var(--color-border)] bg-white px-6 py-6 text-center"
                >
                  <h4 className="font-semibold text-[#4a2e2e] text-lg mb-2">
                    {tier.label}
                  </h4>
                  <p className="text-sm text-gray-600">{tier.dims}</p>
                  <p className="text-xs text-gray-400 mb-3">{tier.inches}</p>
                  <p className="text-[var(--color-accent)] font-semibold">{tier.price}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Digital */}
          <div>
            <h3 className="text-xs font-semibold text-[#4a2e2e] mb-4 text-center tracking-wide uppercase">
              Digital
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl mx-auto">
              {DIGITAL_TIERS.map((tier) => (
                <div
                  key={tier.label}
                  className="rounded-2xl border border-[var(--color-border)] bg-white px-6 py-6 text-center"
                >
                  <h4 className="font-semibold text-[#4a2e2e] text-lg mb-2">
                    {tier.label}
                  </h4>
                  <p className="text-sm text-gray-600">{tier.dims}</p>
                  {tier.inches && (
                    <p className="text-xs text-gray-400 mb-3">{tier.inches}</p>
                  )}
                  {!tier.inches && <div className="mb-3" />}
                  <p className="text-[var(--color-accent)] font-semibold">{tier.price}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Bottom banner carousel */}
      <BannerCarousel banners={bottomBanners} initialIndex={bottomInitialIndex} />

      {/* Past commissions grid — renders when paired images (non-banner) are uploaded */}
      {commissionPairs.length > 0 && (
        <section className="bg-[var(--color-surface-2)] py-12 sm:py-16 px-6">
          <div className="max-w-5xl mx-auto">
            <h2
              className="text-2xl sm:text-3xl text-[var(--color-accent)] text-center mb-10"
              style={{ fontFamily: "var(--font-fraunces)" }}
            >
              Past commissions
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
              {commissionPairs.map((img) => (
                <div
                  key={img.name}
                  className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden shadow-lg art-frame"
                >
                  <Image
                    src={img.url}
                    alt="Commission painting by Anne"
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Enquiry form */}
      <section id="commission-form" className="py-12 sm:py-20 px-6">
        <div className="max-w-2xl mx-auto">
          <h2
            className="text-2xl sm:text-3xl text-[var(--color-accent)] text-center mb-2"
            style={{ fontFamily: "var(--font-fraunces)" }}
          >
            Tell me your vision
          </h2>
          <p className="text-center text-sm text-gray-500 mb-8">
            I reply to every enquiry personally, usually within 24 hours.
          </p>
          <CommissionForm />
        </div>
      </section>
    </div>
  );
}
