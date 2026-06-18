import Link from "next/link";

export default function CommissionCTA() {
  return (
    <section className="bg-[var(--color-surface-2)] py-12 sm:py-16 px-6 text-center">
      <h2
        className="text-2xl sm:text-3xl text-[var(--color-accent)]"
        style={{ fontFamily: "var(--font-fraunces)" }}
      >
        Want something made just for you?
      </h2>
      <p className="mt-4 text-gray-600 max-w-lg mx-auto leading-relaxed">
        A portrait of your partner? A sticker with your pet? A cover for your
        book? If you can picture it, we can bring it to life.
      </p>
      <Link
        href="/commissions"
        className="mt-8 inline-block px-8 py-3 text-sm font-medium site-btn"
      >
        Request a Commission
      </Link>
    </section>
  );
}
