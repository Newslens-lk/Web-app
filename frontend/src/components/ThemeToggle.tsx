"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

/**
 * Light/dark switch for the masthead.
 *
 * The inline script in src/app/layout.tsx stamps
 * `document.documentElement.dataset.theme` before the first paint, so the page
 * never flashes the wrong palette. This component only mirrors whatever is
 * already on the element into React state so the icon and label stay accurate,
 * then flips it on click.
 *
 * With no stored preference the attribute is absent and the OS preference
 * decides (see the `prefers-color-scheme` block in globals.css) — so we read
 * the media query, not a hardcoded default, to pick the starting icon.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const stamped = document.documentElement.dataset.theme as Theme | undefined;
    if (stamped === "dark" || stamped === "light") {
      setTheme(stamped);
      return;
    }
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setTheme(prefersDark ? "dark" : "light");
  }, []);

  function toggle() {
    if (theme === null) return;
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {
      // Storage can be unavailable (private mode, blocked site data). The
      // attribute still flips, so the choice works — it just won't survive
      // a reload.
    }
    setTheme(next);
  }

  // Hold the button's footprint on the server and first client render so the
  // masthead doesn't shift when the real control appears.
  if (theme === null) {
    return <div className="w-[34px] h-[34px]" aria-hidden />;
  }

  const label = theme === "dark" ? "Switch to light theme" : "Switch to dark theme";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className="rounded-md border border-transparent p-2 text-ink-dim hover:bg-surface-2 hover:text-ink transition-colors"
    >
      {theme === "dark" ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

function SunIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}
