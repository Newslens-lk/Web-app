import Link from "next/link";
import type { EventSummary } from "@/lib/types";
import { relativeTime } from "@/lib/api";
import { getDictionary } from "@/lib/i18n/server";
import { BiasBar } from "./BiasBar";
import { SourceBadge } from "./SourceBadge";
import { ArticleImage } from "./ArticleImage";

type Props = {
  event: EventSummary;
};

/**
 * A story in the feed.
 *
 * Compact cards let readers scan several stories together. Coverage ranking
 * is handled by the feed, without an oversized featured card.
 *
 * The five-colour legend that used to sit on every card is gone. Repeated
 * twenty times it stopped being a key and became texture; the bar carries the
 * shape of the coverage, and the full breakdown lives on the event page where
 * someone is actually asking the question.
 */
export function EventCard({ event }: Props) {
  const t = getDictionary();

  return (
    <Link
      href={`/events/${event.event_id}`}
      className={[
        "editorial-story group relative flex min-w-0 flex-col overflow-hidden rounded-none border border-rule bg-surface shadow-1",
        "transition-[box-shadow,transform,border-color] duration-200 ease-out",
        "hover:border-rule-strong hover:shadow-2",
      ].join(" ")}
    >
      {/* Flush to the card's edges — an image inset inside its own padding is
          what makes a card look like a slide rather than a page. */}
      {event.image_url && (
        <ArticleImage
          src={event.image_url}
          alt={event.representative_title}
          className="h-32 w-full object-cover"
        />
      )}

      <div className="flex flex-col gap-2 p-3">
      {event.topic && (
        <span className="text-xs font-semibold uppercase tracking-eyebrow text-amber">
          {event.topic}
        </span>
      )}

      <h3
        className="line-clamp-3 font-serif text-base font-semibold leading-snug transition-colors group-hover:text-brand"
        title={event.representative_title}
      >
        {event.representative_title}
      </h3>

      <p className="text-xs text-ink-dim">
        {t.home.eventMeta(
          event.article_count,
          event.source_count,
          relativeTime(event.window_end, t),
        )}
      </p>

      {/* The coverage, as a shape, with each position named inside its own
          segment. A story every outlet framed the same way reads as one solid
          band; a contested one reads as three or four. No legend needed. */}
      <BiasBar distribution={event.bias_distribution} size="xl" className="!h-7" />

      <div className="flex flex-wrap gap-1.5">
        {event.sources.map((s) => (
          <SourceBadge key={s} name={s} />
        ))}
      </div>
      </div>
    </Link>
  );
}
