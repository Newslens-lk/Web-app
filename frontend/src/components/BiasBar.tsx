import type { BiasDistribution } from "@/lib/types";
import { BIAS_LABELS, BIAS_COLORS } from "@/lib/constants";

type Props = {
  distribution: BiasDistribution;
  size?: "sm" | "lg";
  className?: string;
};

export function BiasBar({ distribution, size = "sm", className }: Props) {
  const total = BIAS_LABELS.reduce((s, b) => s + (distribution[b] ?? 0), 0) || 1;
  const h = size === "lg" ? "h-3" : "h-[7px]";
  const r = size === "lg" ? "rounded-md" : "rounded";

  return (
    <div
      aria-hidden
      className={`flex overflow-hidden bg-surface-3 ${h} ${r} ${className ?? ""}`}
    >
      {BIAS_LABELS.map((label) => (
        <span
          key={label}
          style={{
            backgroundColor: BIAS_COLORS[label],
            flexGrow: (distribution[label] ?? 0) / total,
            flexShrink: 0,
          }}
          className="block"
        />
      ))}
    </div>
  );
}
