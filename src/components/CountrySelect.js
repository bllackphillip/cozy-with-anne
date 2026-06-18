"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { COUNTRY_CODES, NAME_OVERRIDES } from "@/data/countries";

/*
  COUNTRY SELECT — a searchable, flag-prefixed country combobox used by the cart
  to choose the shipping destination. Trigger button -> popover with a search box
  on top and a scrollable list (flag + name). The popover opens UPWARD because the
  control sits in the cart footer near the bottom of the screen.

  Flags are self-hosted via the `flag-icons` package (CSS class `fi fi-<code>`,
  imported globally in layout.js), so they render reliably offline with no
  third-party request. Names come from Intl.DisplayNames so we don't hand-maintain
  ~190 country names.

  Accessible: combobox/listbox roles, type-to-filter, arrow-key navigation,
  Enter to select, Escape / click-outside to close.
*/
export default function CountrySelect({ id, value, onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const activeRef = useRef(null);
  const triggerRef = useRef(null);

  const countries = useMemo(() => {
    let dn = null;
    try {
      dn = new Intl.DisplayNames(["en"], { type: "region" });
    } catch {
      dn = null;
    }
    return COUNTRY_CODES.map((code) => ({
      code,
      name: NAME_OVERRIDES[code] || (dn && dn.of(code)) || code,
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return countries;
    return countries.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    );
  }, [countries, query]);

  const selected = countries.find((c) => c.code === value) || null;

  // Focus the search box when the popover opens.
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Keep the highlighted row in view while arrowing through the list.
  useEffect(() => {
    if (open) activeRef.current?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    function onDown(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  function choose(code) {
    onChange(code);
    setOpen(false);
    setQuery("");
    triggerRef.current?.focus();
  }

  function onInputKeyDown(e) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const c = filtered[activeIndex];
      if (c) choose(c.code);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        id={id}
        ref={triggerRef}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
      >
        <span className="flex items-center gap-2 min-w-0">
          {selected ? (
            <>
              <span
                className={`fi fi-${selected.code.toLowerCase()} shrink-0 rounded-[2px] ring-1 ring-black/10`}
                style={{ fontSize: "1.05rem" }}
              />
              <span className="truncate">{selected.name}</span>
            </>
          ) : (
            <span className="text-gray-400">Select country</span>
          )}
        </span>
        <svg
          className={`w-4 h-4 shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 right-0 bottom-full mb-2 z-20 rounded-lg border border-gray-200 bg-white shadow-xl overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIndex(0); // reset highlight to the top match
              }}
              onKeyDown={onInputKeyDown}
              placeholder="Search country…"
              aria-label="Search country"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            />
          </div>
          <ul role="listbox" className="max-h-64 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-gray-400">No countries found</li>
            ) : (
              filtered.map((c, i) => {
                const isActive = i === activeIndex;
                const isSelected = c.code === value;
                return (
                  <li
                    key={c.code}
                    ref={isActive ? activeRef : null}
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setActiveIndex(i)}
                    onClick={() => choose(c.code)}
                    className={`flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer ${
                      isActive ? "bg-[var(--color-surface-2)]" : ""
                    } ${isSelected ? "font-medium text-[var(--color-accent)]" : "text-gray-800"}`}
                  >
                    <span
                      className={`fi fi-${c.code.toLowerCase()} shrink-0 rounded-[2px] ring-1 ring-black/10`}
                      style={{ fontSize: "1.05rem" }}
                    />
                    <span className="truncate">{c.name}</span>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
