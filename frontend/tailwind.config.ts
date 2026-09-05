import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class", '[data-theme="dark"]'],
  content: [
    "./src/components/**/*.{ts,tsx}",
    "./src/app/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
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
        card: "0 1px 2px rgba(23,26,28,0.06), 0 1px 1px rgba(23,26,28,0.04)",
      },
    },
  },
  plugins: [],
};
export default config;
