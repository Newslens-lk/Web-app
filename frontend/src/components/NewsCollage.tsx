import type { CSSProperties } from "react";

import { BIAS_COLORS } from "@/lib/constants";
import { sourceDisplayName } from "@/lib/constants";
import type { ArticleSummary } from "@/lib/types";
import { ArticleImage } from "./ArticleImage";

type Props = { articles: ArticleSummary[] };

/**
 * A scattered pile of front pages, as the cover's backdrop.
 *
 * Nothing here is a link. These are real headlines, but on this page they are
 * an illustration of what the site does rather than a way in — the two buttons
 * are the way in. The whole pile is therefore hidden from assistive tech: a
 * screen reader would otherwise read out a dozen headlines that cannot be
 * opened, and every one of them is on the feed a click away.
 *
 * Each card is placed by hand rather than by a loop over evenly spaced values.
 * A pile that has been dropped has no rhythm to it, and anything regular
 * enough to generate reads as a carousel that forgot to move.
 */

/** Position, rotation, width and stacking for each card, largest first so the
 *  big ones sit behind. Percentages keep the arrangement intact as the canvas
 *  scales. */
const SLOTS = [
  { left: "2%", top: "10%", rotate: -7, width: "w-[300px]", z: "z-10", image: true },
  { left: "27%", top: "0%", rotate: 4, width: "w-[250px]", z: "z-30", image: false },
  { left: "46%", top: "14%", rotate: -3, width: "w-[330px]", z: "z-20", image: true },
  { left: "72%", top: "2%", rotate: 8, width: "w-[240px]", z: "z-10", image: false },
  { left: "12%", top: "52%", rotate: 5, width: "w-[270px]", z: "z-30", image: false },
  { left: "40%", top: "60%", rotate: -6, width: "w-[290px]", z: "z-40", image: true },
  { left: "70%", top: "48%", rotate: 3, width: "w-[260px]", z: "z-20", image: false },
];

export function NewsCollage({ articles }: Props) {
  if (articles.length === 0) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 hidden select-none lg:block"
    >
      {SLOTS.map((slot, i) => {
        const article = articles[i % articles.length];
        return (
          <CollageCard
            key={`${slot.left}-${slot.top}`}
            article={article}
            slot={slot}
            // Staggered so the pile builds up rather than appearing at once.
            // Starts after the headline has had a moment on its own.
            delay={320 + i * 90}
          />
        );
      })}
    </div>
  );
}

function CollageCard({
  article,
  slot,
  delay,
}: {
  article: ArticleSummary;
  slot: (typeof SLOTS)[number];
  delay: number;
}) {
  const edge = article.bias_label ? BIAS_COLORS[article.bias_label] : "var(--bias-center)";

  return (
    <article
      className={`editorial-story settle-in absolute ${slot.width} ${slot.z} overflow-hidden border border-rule-strong bg-surface text-ink shadow-3`}
      style={
        {
          left: slot.left,
          top: slot.top,
          // Read by the settle-in keyframes: the card turns from roughly twice
          // this angle down to it as it lands.
          "--rotate": `${slot.rotate}deg`,
          "--delay": `${delay}ms`,
        } as CSSProperties
      }
    >
      {/* Where the story has a picture, it runs to the card's edges — the pile
          should look like torn-out pages, not like slides. */}
      {slot.image && article.image_url && (
        <ArticleImage src={article.image_url} alt="" className="h-36 w-full object-cover" />
      )}
      <div className="flex flex-col gap-2 p-4">
        <div className="flex items-center gap-2">
          <span className="h-3 w-[3px] shrink-0" style={{ backgroundColor: edge }} />
          <span className="text-xs font-semibold uppercase tracking-eyebrow text-ink-dim">
            {sourceDisplayName(article.source_name)}
          </span>
        </div>
        <h3 className="line-clamp-3 font-serif text-base font-semibold">{article.title}</h3>
      </div>
    </article>
  );
}
