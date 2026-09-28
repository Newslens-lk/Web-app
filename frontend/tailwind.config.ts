import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class", '[data-theme="dark"]'],
  content: [
    "./src/components/**/*.{ts,tsx}",
    "./src/app/**/*.{ts,tsx}",
  ],
  theme: {
    // Replaces Tailwind's scale rather than extending it, so the only sizes
    // that exist are the ones below. An arbitrary `text-[13.5px]` still works
    // if something genuinely needs it, but it now has to be a decision rather
    // than a habit — the codebase had twenty sizes, five of them half-pixel
    // neighbours of another.
    //
    // Seven steps, each carrying the leading and tracking that size wants:
    // headlines tighten as they grow, body text stays open.
    fontSize: {
      xs: ["11px", { lineHeight: "1.45" }],
      sm: ["13px", { lineHeight: "1.5" }],
      base: ["15px", { lineHeight: "1.65" }],
      md: ["19px", { lineHeight: "1.3", letterSpacing: "-0.01em" }],
      lg: ["24px", { lineHeight: "1.22", letterSpacing: "-0.015em" }],
      xl: ["32px", { lineHeight: "1.12", letterSpacing: "-0.022em" }],
      "2xl": ["44px", { lineHeight: "1.05", letterSpacing: "-0.03em" }],
    },
    extend: {
      keyframes: {
        // Drives ShineBorder. Under `motion-safe:` so a reader who has asked
        // for less motion simply gets a still gradient edge.
        shine: {
          "0%": { backgroundPosition: "0% 0%" },
          "50%": { backgroundPosition: "100% 100%" },
          "100%": { backgroundPosition: "0% 0%" },
        },
      },
      animation: {
        shine: "shine var(--shine-duration, 14s) linear infinite",
      },
      letterSpacing: {
        // One value for every uppercase label on the site. There were seven,
        // between 0.1em and 0.22em, all doing this same job.
        eyebrow: "0.14em",
      },
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        "surface-3": "var(--surface-3)",
        ink: "var(--ink)",
        "ink-dim": "var(--ink-dim)",
        "ink-faint": "var(--ink-faint)",
        rule: "var(--rule)",
        "rule-strong": "var(--rule-strong)",
        brand: "var(--brand)",
        "brand-ink": "var(--brand-ink)",
        "brand-tint": "var(--brand-tint)",
        amber: "var(--amber)",
        "amber-tint": "var(--amber-tint)",
      },
      fontFamily: {
        serif: ["var(--font-serif)"],
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
      maxWidth: {
        shell: "1180px",
      },
      boxShadow: {
        // Driven by CSS variables so dark mode can swap the whole scale —
        // see the elevation note in globals.css.
        1: "var(--shadow-1)",
        2: "var(--shadow-2)",
        3: "var(--shadow-3)",
      },
    },
  },
  plugins: [],
};
export default config;
