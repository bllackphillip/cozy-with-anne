"use client";

import { useState, useEffect } from "react";

const THEMES = [
  {
    id: "atelier",
    label: "The Atelier",
    dot: "#a06868",
    ring: "#5c4448",
  },
  {
    id: "evening",
    label: "Purple Evening",
    dot: "#6668a0",
    ring: "#4d455c",
  },
  {
    id: "garden",
    label: "Olive Garden",
    dot: "#6a7852",
    ring: "#515344",
  },
  {
    id: "beeswax",
    label: "Beeswax",
    dot: "#786a50",
    ring: "#51483f",
  },
];

export default function ThemeSwitcher() {
  const [activeTheme, setActiveTheme] = useState("atelier");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("cwa-theme");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration-safe: the real theme is already applied pre-hydration by the inline script in layout.js; this only syncs this widget's local state from the same localStorage key after mount, so starting from the default avoids an SSR mismatch
      if (saved) setActiveTheme(saved);
    } catch (_) {}
  }, []);

  function applyTheme(id) {
    setActiveTheme(id);
    document.documentElement.setAttribute("data-theme", id);
    try {
      localStorage.setItem("cwa-theme", id);
    } catch (_) {}
    setOpen(false);
  }

  const current = THEMES.find((t) => t.id === activeTheme) ?? THEMES[0];

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2">
      {/* Theme options — revealed when open */}
      {open && (
        <div className="flex flex-col items-end gap-2 mb-1">
          {THEMES.map((theme) => (
            <button
              key={theme.id}
              onClick={() => applyTheme(theme.id)}
              title={theme.label}
              className="flex items-center gap-2 group"
            >
              <span
                className="text-xs font-medium text-gray-500 group-hover:text-gray-800 transition-colors opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ whiteSpace: "nowrap" }}
              >
                {theme.label}
              </span>
              <span
                className="block w-6 h-6 rounded-full shadow-md transition-transform group-hover:scale-110"
                style={{
                  backgroundColor: theme.dot,
                  outline: activeTheme === theme.id ? `2px solid ${theme.ring}` : "2px solid transparent",
                  outlineOffset: "2px",
                }}
              />
            </button>
          ))}
        </div>
      )}

      {/* Toggle button — shows current theme colour */}
      <button
        onClick={() => setOpen((v) => !v)}
        title="Switch theme"
        className="w-9 h-9 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110"
        style={{
          backgroundColor: current.dot,
          outline: `2px solid ${current.ring}`,
          outlineOffset: "2px",
        }}
        aria-label="Switch colour theme"
      >
        <svg
          className="w-4 h-4 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z"
          />
        </svg>
      </button>
    </div>
  );
}
