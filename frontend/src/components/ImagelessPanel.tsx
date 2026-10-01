import { BIAS_COLORS, sourceDisplayName } from "@/lib/constants";
import type { BiasLabel } from "@/lib/types";

type Props = { title: string; source: string; biasLabel?: BiasLabel | null; className?: string };

/**
 * Stands in for a missing photo by carrying the headline itself. Cards that use
 * it hide their own headline with `group-has-[[data-imageless]]:hidden`.
 */
export function ImagelessPanel({ title, source, biasLabel, className = "" }: Props) {
  return (
    <div
      data-imageless
      className={`${className} imageless flex flex-col justify-between gap-4 p-5`}
      style={{ borderTopColor: biasLabel ? BIAS_COLORS[biasLabel] : undefined }}
    >
      <span className="text-xs font-semibold uppercase tracking-eyebrow text-ink-dim">
        {sourceDisplayName(source)}
      </span>
      <p className="line-clamp-4 font-serif text-md font-semibold leading-snug text-ink text-balance">
        {title}
      </p>
    </div>
  );
}
