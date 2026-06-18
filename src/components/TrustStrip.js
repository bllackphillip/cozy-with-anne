import Link from "next/link";

/*
  B8 — trust / reassurance strip shown under the Add to Cart on every product
  page, at the moment of the purchase decision. Three signals:
    - secure checkout (Stouthuysen et al. 2018; Quintus et al. 2024)
    - clear returns (Oghazi et al. 2018; McKnight Integrity)
    - honest eco packaging (McKnight Integrity; Oliver 2024)
  All colours are theme tokens so it adapts across the 4 palettes.
*/

function LockIcon() {
  return (
    <svg className="w-4 h-4 shrink-0 text-[var(--color-accent)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

function ReturnIcon() {
  return (
    <svg className="w-4 h-4 shrink-0 text-[var(--color-accent)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 14 4 9l5-5" />
      <path d="M4 9h11a5 5 0 0 1 5 5v1a5 5 0 0 1-5 5H9" />
    </svg>
  );
}

function LeafIcon() {
  return (
    <svg className="w-4 h-4 shrink-0 text-[var(--color-accent)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 20A7 7 0 0 1 18 4h3v3a7 7 0 0 1-10 13Z" />
      <path d="M5 21c.5-4 2.5-7 6-9" />
    </svg>
  );
}

export default function TrustStrip() {
  return (
    <ul className="mt-6 flex flex-col gap-2.5 text-sm text-gray-600">
      <li className="flex items-start gap-2.5">
        <LockIcon />
        <span>Secure checkout with Stripe. Your card details never touch this site.</span>
      </li>
      <li className="flex items-start gap-2.5">
        <ReturnIcon />
        <span>
          14-day returns on prints, stickers and in-stock originals.{" "}
          <Link href="/policies/refund" className="underline text-[var(--color-accent)] hover:opacity-80">
            See returns
          </Link>
        </span>
      </li>
      <li className="flex items-start gap-2.5">
        <LeafIcon />
        <span>Carefully packed in recycled, plastic-free materials.</span>
      </li>
    </ul>
  );
}
