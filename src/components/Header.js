"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/context/CartContext";

/*
  HEADER with Cart Icon and Click-triggered Dropdowns

  APPROACH HISTORY — kept as a record of the thought process:

  Attempt 1: opacity-0 on background div when isHome && !pastHero
    → Discarded: CSS can't transition background-image, only opacity.
      Used a separate absolutely-positioned background div with transition-opacity.
      Smooth fade worked but user preferred a sharp switch.

  Attempt 2: bg-[#f5f0e8] (solid color, no texture) for the "transparent" state
    → Discarded: solid color without texture created a visible seam against the
      textured hero section below.

  Attempt 3: scrollY === 0 → warm, scrollY > 0 → transparent
    → Discarded: switching to transparent at scrollY=1 showed white html background
      because the hero section hadn't risen behind the header yet (only 1px of hero
      was behind the header area; the rest was still the white html background).

  Attempt 4: scrollY < HEADER_HEIGHT (64px) → warm, scrollY >= 64 → transparent
    → Better — no white flash at transition point. But still imperfect because
      at exactly scrollY=64 the hero fills the header area only at the top edge,
      and rapid scrolling could still expose edge cases.

  // const HEADER_HEIGHT = 64;
  // const [heroCoversHeader, setHeroCoversHeader] = useState(false);
  // useEffect(() => {
  //   if (!isHome) return;
  //   const handleScroll = () => setHeroCoversHeader(window.scrollY >= HEADER_HEIGHT);
  //   setHeroCoversHeader(window.scrollY >= HEADER_HEIGHT);
  //   window.addEventListener("scroll", handleScroll, { passive: true });
  //   return () => window.removeEventListener("scroll", handleScroll);
  // }, [isHome]);

  Final approach (below): extend the hero section 64px upward behind the header
  using -mt-16 in page.js. Since both use background-attachment: fixed, the texture
  aligns perfectly. The header is always transparent on the homepage — no scroll
  listener, no threshold, no edge cases.
*/

const navLinks = [
  { href: "/", label: "Home" },
  {
    href: "/portfolio",
    label: "Portfolio",
    dropdown: [
      { href: "/portfolio/oil-paintings", label: "Oil Paintings" },
      { href: "/portfolio/digital-art", label: "Digital Art" },
      { href: "/portfolio/sketches", label: "Sketches" },
    ],
  },
  {
    href: "/shop",
    label: "Shop",
    dropdown: [
      { href: "/shop/originals", label: "Originals" },
      { href: "/shop/prints", label: "Prints" },
      { href: "/shop/stickers", label: "Stickers" },
    ],
  },
  { href: "/commissions", label: "Commissions" },
  { href: "/about", label: "About" },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pastHero, setPastHero] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [mobileExpanded, setMobileExpanded] = useState(null);
  const headerRef = useRef(null);
  const { cartCount, setIsCartOpen } = useCart();
  const pathname = usePathname();
  const isHome = pathname === "/";

  // Derive close-on-navigate during render — the React-recommended alternative
  // to setState-in-effect. When pathname changes, React re-renders immediately
  // with the reset state without running any effect.
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setOpenDropdown(null);
    setMobileMenuOpen(false);
    setMobileExpanded(null);
  }

  /*
    IntersectionObserver watches a tiny sentinel div placed at the bottom of the
    hero section in page.js. When the sentinel scrolls out of view (user has
    scrolled past the hero), isIntersecting becomes false and we set pastHero=true,
    which adds the border. Scrolling back up reverses it.
  */
  useEffect(() => {
    if (!isHome) return;

    const sentinel = document.getElementById("hero-end");
    if (!sentinel) return;

    // Read the actual rendered header height instead of hardcoding 64px.
    const height = headerRef.current ? headerRef.current.offsetHeight : 64;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setPastHero(!entry.isIntersecting);
      },
      { threshold: 0, rootMargin: `-${height}px 0px 0px 0px` },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [isHome]);

  // Close desktop dropdown when clicking outside the header
  useEffect(() => {
    if (!openDropdown) return;
    function handleClick(e) {
      if (headerRef.current && !headerRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [openDropdown]);

  // Toggle scroll lock + hero fade class on <html> when mobile menu opens/closes.
  // This is a legitimate effect — syncing React state to an external system (the DOM).
  useEffect(() => {
    document.documentElement.classList.toggle("mobile-menu-open", mobileMenuOpen);
    return () => document.documentElement.classList.remove("mobile-menu-open");
  }, [mobileMenuOpen]);

  function toggleDropdown(label) {
    setOpenDropdown((prev) => (prev === label ? null : label));
  }

  // Derived: header is transparent only on homepage before scrolling past hero,
  // with menu closed. All other states are solid (floral background + border).
  const isTransparent = isHome && !pastHero && !mobileMenuOpen;

  return (
    <header ref={headerRef} className="sticky top-0 z-50">
      {/* Persistent background layer — always in the DOM from first render.
          background-attachment: fixed is set once and never toggled, so the
          GPU compositing layer is pre-created and never causes a jump. */}
      <div
        className={`absolute inset-0 floral-top ${isTransparent ? "opacity-0 pointer-events-none" : "border-b border-[var(--color-border)]"}`}
        aria-hidden="true"
      />

      <nav className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link
            href="/"
            className={`text-2xl font-bold text-[#FAF6F0] transition-opacity ${isTransparent ? "opacity-0 pointer-events-none select-none" : "opacity-100"}`}
            style={{
              fontFamily: "var(--font-dancing)",
              textShadow: "0 2px 12px rgba(53,41,41,1), 0 1px 4px rgba(53,41,41,1), 0 0 8px rgba(53,41,41,1)",
            }}
            tabIndex={isTransparent ? -1 : undefined}
            aria-hidden={isTransparent ? "true" : undefined}
          >
            cozy with anne
          </Link>

          {/* Desktop Navigation + Cart Icon */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => {
              const isActive =
                link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);

              if (link.dropdown) {
                const isOpen = openDropdown === link.label;
                return (
                  <div key={link.href} className="relative">
                    <button
                      onClick={() => toggleDropdown(link.label)}
                      className={`text-sm font-medium px-4 py-1.5 flex items-center gap-1 ${
                        isActive ? "site-btn-active" : "site-btn"
                      }`}
                    >
                      {link.label}
                      <svg
                        className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {isOpen && (
                      <div className="absolute top-full left-0 mt-2 w-44 bg-[var(--color-bg)] rounded-xl shadow-[0_3px_10px_rgba(74,46,46,0.55)] border border-[var(--color-border)] py-1 overflow-hidden">
                        {link.dropdown.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={`block px-4 py-2 text-sm transition-colors ${
                              pathname === item.href
                                ? "text-[var(--color-accent)] font-semibold bg-[var(--color-surface)]"
                                : "text-[var(--color-accent)] hover:bg-[var(--color-surface)]"
                            }`}
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium px-4 py-1.5 ${
                    isActive ? "site-btn-active" : "site-btn"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}

            {/* Cart icon button (desktop) */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 site-btn"
              aria-label="Open cart"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-gray-900 text-white text-[10px] font-bold rounded-full leading-none px-1">
                  {cartCount}
                </span>
              )}
            </button>
          </div>

          {/* Mobile: Cart + Hamburger */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 site-btn"
              aria-label="Open cart"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-gray-900 text-white text-[10px] font-bold rounded-full leading-none px-1">
                  {cartCount}
                </span>
              )}
            </button>

            <button
              className="p-2 site-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {/* w-5 h-5 matches the cart icon container so both buttons are the same pill size.
                  The bars are w-4 (narrower than the container) so they appear smaller than before. */}
              <div className="w-5 h-5 flex flex-col items-center justify-center gap-[3px]">
                <span className={`block h-[2px] w-4 bg-current transition-transform duration-200 ${mobileMenuOpen ? "rotate-45 translate-y-[5px]" : ""}`} />
                <span className={`block h-[2px] w-4 bg-current transition-opacity duration-200 ${mobileMenuOpen ? "opacity-0" : ""}`} />
                <span className={`block h-[2px] w-4 bg-current transition-transform duration-200 ${mobileMenuOpen ? "-rotate-45 -translate-y-[5px]" : ""}`} />
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu
            Always mounted (not conditional) so that the CSS keyframe animation fires
            each time the menu opens. `hidden` is used instead of unmounting so the
            animation replays reliably. */}
        <div className={`md:hidden ${mobileMenuOpen ? "" : "hidden"}`}>
          <div className="flex flex-col gap-1 pt-2 pb-4 items-end">
            {navLinks.map((link, index) => {
              const isActive =
                link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
              const isExpanded = mobileExpanded === link.label;

              // Each item staggers in from the right. Uses inline style because
              // Tailwind can't generate arbitrary animationDelay at runtime.
              const animStyle = {
                animationName: "slideInRight",
                animationDuration: "0.22s",
                animationTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
                animationDelay: `${index * 45}ms`,
                animationFillMode: "both",
              };

              if (link.dropdown) {
                return (
                  <div key={link.href} className="w-48" style={animStyle}>
                    <button
                      onClick={() =>
                        setMobileExpanded(isExpanded ? null : link.label)
                      }
                      className={`w-full relative flex items-center justify-center py-2 px-4 text-sm font-medium ${
                        isActive ? "site-btn-active" : "site-btn"
                      }`}
                    >
                      {link.label}
                      <svg
                        className={`absolute right-4 w-3 h-3 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {isExpanded && (
                      <div className="mt-1 bg-[var(--color-bg)] rounded-xl border border-[var(--color-border)] overflow-hidden py-1 shadow-[0_3px_10px_rgba(74,46,46,0.35)]">
                        {link.dropdown.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={`block px-4 py-2 text-sm transition-colors ${
                              pathname === item.href
                                ? "text-[var(--color-accent)] font-semibold bg-[var(--color-surface)]"
                                : "text-[var(--color-accent)] hover:bg-[var(--color-surface)]"
                            }`}
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`w-48 block py-2 px-4 text-sm font-medium text-center ${
                    isActive ? "site-btn-active" : "site-btn"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                  style={animStyle}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </header>
  );
}
