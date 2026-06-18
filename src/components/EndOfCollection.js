"use client";

import { useState } from "react";

/*
  END OF COLLECTION — a warm "you've reached the end" moment shown at the foot of
  a grid once every piece has loaded, plus a newsletter invitation in Anne's
  voice (new work, seasonal discounts, local art-market pop-ups). Sits on the
  same theme-adaptive band (--color-surface-2) as the homepage Featured Works.

  The signup persists to the Firestore `subscribers` collection via
  /api/newsletter (validated server-side). A welcome email from
  newsletter@cozywithanne.com is a future follow-up.
*/
export default function EndOfCollection() {
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState(""); // honeypot — stays empty for humans
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim() || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, company }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not sign you up.");
      setDone(true);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="bg-[var(--color-surface-2)] py-14 sm:py-20 px-6">
      <div className="max-w-xl mx-auto text-center">
        <h2
          className="text-2xl sm:text-3xl text-[var(--color-accent)]"
          style={{ fontFamily: "var(--font-fraunces)" }}
        >
          That&apos;s it, for now
        </h2>
        <p className="mt-4 text-gray-700 leading-relaxed">
          But the website is freshly launched, and each collection has plenty
          more on the way. Join my little newsletter to follow along - I&apos;ll
          send a gentle note whenever new artworks arrive, share the occasional
          discount or giveaway, and let you know where to find me next at local
          art-market pop-ups.
        </p>

        {done ? (
          <p className="mt-8 text-[var(--color-accent)] font-medium">
            Thank you - you&apos;re on the list. I&apos;ll be in touch soon 💌
          </p>
        ) : (
          <>
            <form
              onSubmit={handleSubmit}
              className="mt-8 flex flex-col sm:flex-row gap-3 justify-center"
            >
              <label htmlFor="newsletter-email" className="sr-only">
                Email address
              </label>
              {/* Honeypot: hidden from real users; a filled value flags a bot. */}
              <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", width: 1, height: 1, overflow: "hidden" }}>
                <label htmlFor="newsletter-company">Company</label>
                <input
                  id="newsletter-company"
                  type="text"
                  name="company"
                  tabIndex={-1}
                  autoComplete="off"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                />
              </div>
              <input
                id="newsletter-email"
                type="email"
                required
                disabled={submitting}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full sm:w-72 rounded-full border border-[var(--color-border-warm)] bg-white px-5 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={submitting}
                className="px-8 py-3 text-sm font-medium site-btn-active whitespace-nowrap disabled:opacity-70"
              >
                {submitting ? "Adding you..." : "Keep me posted"}
              </button>
            </form>
            {error && (
              <p className="mt-4 text-sm text-red-600" role="alert">
                {error}
              </p>
            )}
          </>
        )}
      </div>
    </section>
  );
}
