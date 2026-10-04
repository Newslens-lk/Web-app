"use client";

import { useState } from "react";
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

const INITIALS_TEXT = {
  sm: "text-[9px]",
  md: "text-xs",
  lg: "text-sm",
};

const NAME = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-md",
};

function initials(name: string): string {
  return name
    .split(/[\s_]+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 3);
}

function InitialsTile({ name, size }: { name: string; size: "sm" | "md" | "lg" }) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center overflow-hidden border border-rule bg-surface-2 ${TILE[size]}`}
    >
      <span className={`font-semibold leading-none text-ink-dim ${INITIALS_TEXT[size]}`}>
        {initials(name)}
      </span>
    </span>
  );
}

/**
 * An outlet's identity.
 *
 * The tile is always square, whatever shape the logo is. The supplied files
 * range from nearly square to a 3.5:1 banner, and letting each set its own
 * width produced a ragged row where no two outlets lined up. A fixed square
 * with the logo contained inside costs some empty space on the wide ones and
 * buys a column that actually scans.
 *
 * When a logo fails to load or no logo file is configured, the tile shows
 * the outlet's initials on a neutral background so it never renders as a
 * blank white box.
 */
export function SourceBadge({ name, size = "sm", showName = false }: Props) {
  const logo = sourceLogo(name);
  const label = sourceDisplayName(name);
  const [imgFailed, setImgFailed] = useState(false);

  const showLogo = logo && !imgFailed;

  const tile = showLogo ? (
    <span
      className={`flex shrink-0 items-center justify-center overflow-hidden border border-rule bg-white ${TILE[size]}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logo}
        alt={showName ? "" : label}
        loading="lazy"
        onError={() => setImgFailed(true)}
        className="max-h-full max-w-full object-contain"
      />
    </span>
  ) : (
    <InitialsTile name={label} size={size} />
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
