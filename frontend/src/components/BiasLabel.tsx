import type { BiasLabel as BiasLabelType } from "@/lib/types";
import { BIAS_COLORS, BIAS_DISPLAY } from "@/lib/constants";

type Props = {
  label: BiasLabelType | null;
  confidence?: number | null;
};

export function BiasLabel({ label, confidence }: Props) {
  if (!label) return null;
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-white px-2 py-[3px] rounded"
      style={{ backgroundColor: BIAS_COLORS[label] ?? "#6B7280" }}
    >
      {BIAS_DISPLAY[label] ?? label}
      {confidence != null && (
        <span className="font-mono opacity-80">{Math.round(confidence * 100)}%</span>
      )}
    </span>
  );
}
