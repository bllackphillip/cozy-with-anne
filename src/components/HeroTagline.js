"use client";

import { useState, useEffect } from "react";

const STATIC = "Original oil paintings, digital art, prints & stickers";
const TYPED = " - all made with love";
const HERO_MS = 700;
const CHAR_MS = 35;
const LOVE_CHAR_MS = 70;
const LOVE_START = 17; // index of 'l' in 'love' within TYPED
const LOVE_END = 21; // index after 'e'

export default function HeroTagline() {
  const [typedCount, setTypedCount] = useState(() => {
    if (typeof window === "undefined") return 0;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? TYPED.length
      : 0;
  });
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) return;
    const t = setTimeout(() => setTyping(true), HERO_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!typing || typedCount >= TYPED.length) return;
    const delay =
      typedCount >= LOVE_START && typedCount < LOVE_END
        ? LOVE_CHAR_MS
        : CHAR_MS;
    const t = setTimeout(() => setTypedCount((c) => c + 1), delay);
    return () => clearTimeout(t);
  }, [typing, typedCount]);

  const done = typedCount >= TYPED.length;
  const cursorActive = typing && !done;

  return (
    <p
      className="mt-6 text-lg sm:text-xl text-[#faf6f0] max-w-2xl mx-auto"
      style={{
        textShadow:
          "0 2px 12px rgba(53,41,41,1), 0 1px 4px rgba(53,41,41,1), 0 0 8px rgba(53,41,41,1)",
      }}
    >
      {STATIC}
      {/* Visible typed portion — split to colour "love" differently */}
      {typedCount <= LOVE_START ? (
        <span>{TYPED.slice(0, typedCount)}</span>
      ) : typedCount <= LOVE_END ? (
        <>
          <span>{TYPED.slice(0, LOVE_START)}</span>
          <span
            style={{ fontFamily: "var(--font-dancing)", fontSize: "1.48em" }}
          >
            {TYPED.slice(LOVE_START, typedCount)}
          </span>
        </>
      ) : (
        <>
          <span>{TYPED.slice(0, LOVE_START)}</span>
          <span
            style={{ fontFamily: "var(--font-dancing)", fontSize: "1.48em" }}
          >
            love
          </span>
          <span>{TYPED.slice(LOVE_END, typedCount)}</span>
        </>
      )}
      {/* Cursor — always rendered so its width is always reserved.
          visibility:hidden keeps the space without showing the character.
          The blink class is only applied while actively typing. */}
      <span
        className={cursorActive ? "typewriter-cursor" : undefined}
        style={{ visibility: cursorActive ? undefined : "hidden" }}
      >
        |
      </span>
      {/* Invisible remainder — opacity:0 holds the full line width and height so
          centering never shifts as characters are revealed. "love" is rendered in
          Dancing Script here so the taller line-height is reserved from the very
          first render — no jump when the font switches mid-animation. */}
      <span style={{ opacity: 0 }}>
        {typedCount < LOVE_START ? (
          <>
            {TYPED.slice(typedCount, LOVE_START)}
            <span
              style={{ fontFamily: "var(--font-dancing)", fontSize: "1.48em" }}
            >
              love
            </span>
          </>
        ) : typedCount < LOVE_END ? (
          <span
            style={{ fontFamily: "var(--font-dancing)", fontSize: "1.48em" }}
          >
            {TYPED.slice(typedCount, LOVE_END)}
          </span>
        ) : null}
      </span>
    </p>
  );
}
