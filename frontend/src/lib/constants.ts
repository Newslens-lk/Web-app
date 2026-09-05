import type { BiasLabel } from "./types";

export const BIAS_COLORS: Record<BiasLabel, string> = {
  far_left: "#DC2626",
  left: "#EA580C",
  center: "#6B7280",
  right: "#2563EB",
  far_right: "#1E3A8A",
};

export const BIAS_LABELS: BiasLabel[] = ["far_left", "left", "center", "right", "far_right"];

export const BIAS_DISPLAY: Record<BiasLabel, string> = {
  far_left: "Far Left",
  left: "Left",
  center: "Center",
  right: "Right",
  far_right: "Far Right",
};

export const SOURCE_COLORS: Record<string, string> = {
  hirunews: "#FF6B00",
  bbc_sinhala: "#BB1919",
  lankadeepa: "#1B5E20",
  newsfirst: "#0D47A1",
  divaina: "#6A1B9A",
};

export const SOURCE_DISPLAY: Record<string, string> = {
  hirunews: "Hiru News",
  bbc_sinhala: "BBC Sinhala",
  lankadeepa: "Lankadeepa",
  newsfirst: "NewsFirst",
  divaina: "Divaina",
};

export function sourceDisplayName(name: string): string {
  return SOURCE_DISPLAY[name] ?? name;
}

export function sourceColor(name: string): string {
  return SOURCE_COLORS[name] ?? "#6B7280";
}
