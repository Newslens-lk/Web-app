import type { BiasDistribution } from "@/lib/mock-events";

type Props = {
  distribution: BiasDistribution;
  size?: "sm" | "lg";
  className?: string;
};

const buckets = ["fl", "l", "c", "r", "fr"] as const;
const bucketBg: Record<(typeof buckets)[number], string> = {
  fl: "bg-spec-fl",
  l: "bg-spec-l",
  c: "bg-spec-c",
  r: "bg-spec-r",
  fr: "bg-spec-fr",
};

/**
 * Horizontal 5-segment spectrum bar for a cluster's bias distribution.
 * Widths are proportional to article counts within the cluster; zero-count
 * buckets shrink to zero and neighbours absorb the space.
 */
export function SpectrumBar({ distribution, size = "sm", className }: Props) {
  const total =
    buckets.reduce((sum, b) => sum + distribution[b], 0) || 1;
  const heightClass = size === "lg" ? "h-3" : "h-[7px]";
  const radiusClass = size === "lg" ? "rounded-md" : "rounded";

  return (
    <div
      aria-hidden
      className={`flex overflow-hidden bg-surface-3 ${heightClass} ${radiusClass} ${className ?? ""}`}
    >
      {buckets.map((b) => (
        <span
          key={b}
          className={`block ${bucketBg[b]}`}
          style={{ flexGrow: distribution[b] / total, flexShrink: 0 }}
        />
      ))}
    </div>
  );
}
