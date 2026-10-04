import type { BiasLabel } from "./types";

// These resolve to the --bias-* custom properties in globals.css rather than
// to literal hex, so the swatches follow the active theme. They are applied as
// inline `style` values, where `var(...)` is resolved by the browser exactly
// like a hex string would be.
export const BIAS_COLORS: Record<BiasLabel, string> = {
  far_left: "var(--bias-far-left)",
  left: "var(--bias-left)",
  center: "var(--bias-center)",
  right: "var(--bias-right)",
  far_right: "var(--bias-far-right)",
};

/**
 * The text colour to use *on* each bias colour.
 *
 * Not always white: the orange at the left of the scale fails contrast under
 * white text (3.5:1), and in dark mode the lifted reds and greys do too. Each
 * pairing is resolved per theme in globals.css so a label is always readable
 * on the colour behind it.
 */
export const BIAS_ON_COLORS: Record<BiasLabel, string> = {
  far_left: "var(--bias-far-left-on)",
  left: "var(--bias-left-on)",
  center: "var(--bias-center-on)",
  right: "var(--bias-right-on)",
  far_right: "var(--bias-far-right-on)",
};

export const BIAS_LABELS: BiasLabel[] = ["far_left", "left", "center", "right", "far_right"];

// English display names for bias labels, used in server components that
// cannot call the i18n hook. For translated names use `t.bias[label]`.
export const BIAS_DISPLAY: Record<BiasLabel, string> = {
  far_left: "Far Left",
  left: "Left",
  center: "Center",
  right: "Right",
  far_right: "Far Right",
};

// The outlets' own brand *colours* are deliberately not used as swatches: two
// of them are a red and a blue, landing exactly where the bias scale puts
// far-left and right, so a bare colour chip would be ambiguous. A logo is
// different — it reads as an identity rather than as a code — so the mastheads
// below are used, and nothing else borrows their colours.
//
// Keys are `source_name` as the pipeline stores it, so a lookup is direct.
// Files live in public/logos and are served from the site root.
export const SOURCE_LOGOS: Record<string, string> = {
  hirunews: "/logos/hirunews.jpg",
  bbc_sinhala: "/logos/bbc_sinhala.webp",
  lankadeepa: "/logos/lankadeepa.png",
  newsfirst: "/logos/newsfirst.jpg",
  divaina: "/logos/divaina.png",
  Ada: "/logos/ada.svg",
  "Ada Derana Sinhala": "/logos/adaderana_sinhala.svg",
};

export const SOURCE_DISPLAY: Record<string, string> = {
  hirunews: "Hiru News",
  bbc_sinhala: "BBC Sinhala",
  lankadeepa: "Lankadeepa",
  newsfirst: "NewsFirst",
  divaina: "Divaina",
  Ada: "Ada",
  "Ada Derana Sinhala": "Ada Derana Sinhala",
};

export function sourceDisplayName(name: string): string {
  return SOURCE_DISPLAY[name] ?? name;
}

export function sourceLogo(name: string): string | null {
  return SOURCE_LOGOS[name] ?? null;
}
