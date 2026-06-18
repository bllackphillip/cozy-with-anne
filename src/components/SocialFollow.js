import { SOCIAL_LINKS } from "@/data/social";

/*
  SOCIAL PRESENCE — "Follow along" section.

  Dissertation grounding: Li et al. (2014) on social cues / social presence as a
  trust driver, and the Benevolence pillar of McKnight's framework — an active,
  reachable seller who shares her process feels present and accountable. Pairs
  with the Testimonials section to form the homepage social-proof zone.

  Links out to Anne's real, live profiles (single source of truth in
  src/data/social.js). No follower scraping — the genuine accounts are the
  signal. Presentational + static, so it renders on the server.
*/
export default function SocialFollow() {
  return (
    <section className="py-12 sm:py-16 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <h2
          className="text-3xl sm:text-4xl text-[var(--color-accent)]"
          style={{ fontFamily: "var(--font-fraunces)" }}
        >
          Come say hi
        </h2>
        <p className="mt-3 text-gray-600">
          New work, studio days and where I&apos;ll be next - I share it all here.
          Come follow along.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-4">
          {SOCIAL_LINKS.map((s) => (
            <a
              key={s.name}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${s.name} - ${s.handle}`}
              className="group inline-flex items-center gap-3 rounded-full border border-[var(--color-border-warm)] bg-[var(--color-surface-2)] px-5 py-3 text-sm text-gray-700 transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
            >
              <svg
                className="w-5 h-5 shrink-0 text-[var(--color-accent)]"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d={s.iconPath} />
              </svg>
              <span className="font-medium">{s.name}</span>
              <span className="text-gray-500 group-hover:text-[var(--color-accent)]">
                {s.handle}
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
