import type { BiasLabel as BiasLabelType } from "@/lib/types";
import { BIAS_COLORS, BIAS_ON_COLORS } from "@/lib/constants";
import { getDictionary } from "@/lib/i18n/server";

type Props = {
  label: BiasLabelType | null;
  confidence?: number | null;
};

export function BiasLabel({ label, confidence }: Props) {
  const t = getDictionary();
  if (!label) return null;
  return (
    <span
      // Use each theme's contrasting text color on the muted bias swatch.
      className="inline-flex items-center gap-1.5 rounded-[2px] px-2 py-[3px] text-xs font-semibold uppercase tracking-wide"
      style={{
        backgroundColor: BIAS_COLORS[label] ?? "var(--bias-center)",
        color: BIAS_ON_COLORS[label] ?? "var(--bias-center-on)",
      }}
    >
      {t.bias[label] ?? label}
      {confidence != null && (
        <span className="font-mono opacity-80">{Math.round(confidence * 100)}%</span>
      )}
    </span>
  );
}
