import type { BiasDistribution } from "@/lib/types";
import { BIAS_LABELS, BIAS_COLORS, BIAS_ON_COLORS } from "@/lib/constants";
import { getDictionary } from "@/lib/i18n/server";

type Props = {
  distribution: BiasDistribution;
  size?: "sm" | "lg" | "xl";
  className?: string;
};

const HEIGHT = { sm: "h-[7px]", lg: "h-3", xl: "h-9" };

/** Below this share a name cannot be set without clipping, so the segment
 *  carries its colour alone. Sinhala names run two to three times the length
 *  of the English ones, which is what sets the threshold this high. */
const LABEL_THRESHOLD = 0.16;

/**
 * How one story's coverage splits across the five positions.
 *
 * At `xl` each segment is named inside itself, which is the only form that
 * needs no legend — the bar explains itself where it sits. Counts are left
 * off deliberately: the point is the shape of the coverage, and a reader who
 * wants the numbers has them on the event page.
 */
export function BiasBar({ distribution, size = "sm", className }: Props) {
  const t = getDictionary();
  const total = BIAS_LABELS.reduce((sum, b) => sum + (distribution[b] ?? 0), 0) || 1;
  const labelled = size === "xl";

  return (
    <div
      className={`flex overflow-hidden rounded-[2px] bg-surface-3 ${HEIGHT[size]} ${className ?? ""}`}
      role="img"
      aria-label={BIAS_LABELS.filter((b) => distribution[b])
        .map((b) => `${t.bias[b]}: ${distribution[b]}`)
        .join(", ")}
    >
      {BIAS_LABELS.map((label) => {
        const count = distribution[label] ?? 0;
        if (!count) return null;
        const share = count / total;

        return (
          <span
            key={label}
            className="flex min-w-0 items-center justify-center"
            style={{
              // flexGrow rather than a width percentage so the segments always
              // fill the track exactly, whatever rounding does.
              flexGrow: share,
              flexShrink: 0,
              flexBasis: 0,
              backgroundColor: BIAS_COLORS[label],
              color: BIAS_ON_COLORS[label],
            }}
          >
            {labelled && share >= LABEL_THRESHOLD && (
              <span className="truncate px-2 text-sm font-semibold leading-none">
                {t.bias[label]}
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}
