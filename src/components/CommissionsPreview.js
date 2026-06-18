import Image from "next/image";
import Link from "next/link";

export const COMMISSIONS_INTRO =
  "Every commission is a collaboration. Whether you have a clear vision or just a feeling, I'll work with you from idea to finished piece - keeping you in the loop every step of the way.";

export default function CommissionsPreview({ bannerUrl }) {
  return (
    <>
      {bannerUrl && (
        <div className="flex justify-center bg-[var(--color-bg)] py-4 sm:py-8">
          <Image
            src={bannerUrl}
            alt="Commission paintings by Anne"
            width={2400}
            height={1000}
            className="w-full h-auto sm:w-auto sm:h-[52vh] rounded-none sm:rounded-2xl shadow-lg art-frame"
          />
        </div>
      )}
      <div className="max-w-xl mx-auto px-6 text-center mt-8 pb-4">
        <p className="text-gray-700 leading-relaxed text-base sm:text-lg">
          {COMMISSIONS_INTRO}
        </p>
        <Link
          href="/commissions"
          className="mt-8 inline-block px-8 py-3 text-sm font-medium site-btn-active"
        >
          Commission a Painting
        </Link>
      </div>
    </>
  );
}
