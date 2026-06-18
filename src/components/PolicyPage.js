/*
  PolicyPage — shared wrapper for the legal/policy pages.
  Renders a consistent heading, an optional "last updated" line, a DRAFT
  banner, and a .policy-prose content area (styling defined in globals.css).

  NOTE: the content currently passed into these pages is placeholder text
  adapted from a reference store and MUST be revised to Cozy with Anne's real
  policies, processors (Stripe, Firebase) and courier before launch.
*/
export default function PolicyPage({ title, lastUpdated, draft = false, children }) {
  return (
    <div className="page-enter max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1
        className="text-3xl sm:text-4xl text-[var(--color-accent)] text-center"
        style={{ fontFamily: "var(--font-fraunces)" }}
      >
        {title}
      </h1>
      {lastUpdated && (
        <p className="mt-3 text-center text-sm text-gray-400">Last updated: {lastUpdated}</p>
      )}

      {/* DRAFT banner — opt-in via the `draft` prop. Off by default now that the
          policies carry real content; flip a page's prop back on if it regresses. */}
      {draft && (
        <div className="mt-8 rounded-xl border border-[var(--color-border-warm)] bg-[var(--color-surface-2)] px-5 py-4 text-sm text-gray-600">
          <strong className="text-[var(--color-accent)]">Draft.</strong> This policy is
          still being finalised.
        </div>
      )}

      <div className="policy-prose mt-8 text-gray-700 leading-relaxed">
        {children}
      </div>
    </div>
  );
}
