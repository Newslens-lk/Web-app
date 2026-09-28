import { sourceDisplayName, sourceLogo } from "@/lib/constants";

type Props = {
  name: string;
  /** 22px for bylines, 30px for lists, 44px where the outlet is the subject. */
  size?: "sm" | "md" | "lg";
  /** Sets the outlet's name beside the tile, for places with room for it. */
  showName?: boolean;
};

const TILE = {
  sm: "h-[22px] w-[22px] rounded-[3px] p-[2px]",
  md: "h-[30px] w-[30px] rounded-[4px] p-[3px]",
  lg: "h-11 w-11 rounded-[6px] p-1",
};

const NAME = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-md",
};

/**
 * An outlet's identity.
 *
 * The tile is always square, whatever shape the logo is. The supplied files
 * range from nearly square to a 3.5:1 banner, and letting each set its own
 * width produced a ragged row where no two outlets lined up. A fixed square
 * with the logo contained inside costs some empty space on the wide ones and
 * buys a column that actually scans.
 *
 * The tile stays white in both themes. These are opaque logos with their own
 * backgrounds, so a tinted tile would fight them — and a light chip on a dark
 * page reads as a deliberate app-icon, which is the effect wanted.
 *
 * An outlet with no logo file falls back to its name in small caps, so a new
 * source from the pipeline never renders as a blank square.
 */
export function SourceBadge({ name, size = "sm", showName = false }: Props) {
  const logo = sourceLogo(name);
  const label = sourceDisplayName(name);

  if (!logo) {
    return (
      <span className="inline-block border border-rule px-1.5 py-[2px] text-xs font-medium uppercase tracking-eyebrow text-ink-dim">
        {label}
      </span>
    );
  }

  const tile = (
    <span
      className={`flex shrink-0 items-center justify-center overflow-hidden border border-rule bg-white ${TILE[size]}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logo}
        alt={showName ? "" : label}
        loading="lazy"
        className="max-h-full max-w-full object-contain"
      />
    </span>
  );

  if (!showName) {
    return <span title={label}>{tile}</span>;
  }

  return (
    <span className="inline-flex items-center gap-2.5">
      {tile}
      <span className={`font-serif font-semibold leading-tight ${NAME[size]}`}>
        {label}
      </span>
    </span>
  );
}
