import Link from "next/link";
import type { EventSummary } from "@/lib/types";
import { getDictionary } from "@/lib/i18n/server";
import { BiasBar } from "./BiasBar";
import { ShineBorder } from "./ShineBorder";
import { SourceBadge } from "./SourceBadge";
import { ArticleImage } from "./ArticleImage";

type Props = {
  event: EventSummary;
  /** The day's most-covered story, given the width of the page. */
  lead?: boolean;
};

/**
 * A story in the feed.
 *
 * Two sizes rather than one: a front page where every item is the same size
 * tells the reader nothing about what matters. The lead is chosen by how many
 * outlets covered the story, so the hierarchy is earned by the data instead of
 * being decoration.
 *
 * The five-colour legend that used to sit on every card is gone. Repeated
 * twenty times it stopped being a key and became texture; the bar carries the
 * shape of the coverage, and the full breakdown lives on the event page where
 * someone is actually asking the question.
 */
export function EventCard({ event, lead = false }: Props) {
  const t = getDictionary();

  return (
    <Link
      href={`/events/${event.event_id}`}
      className={[
        // Raised a little at rest and further on hover, so the card answers
        // the pointer. Only transform and box-shadow animate — both are
        // composited, so this stays smooth on a long feed.
        "group relative flex flex-col overflow-hidden rounded-[3px] border border-rule bg-surface shadow-1",
        "transition-[box-shadow,transform,border-color] duration-200 ease-out",
        "hover:-translate-y-0.5 hover:border-rule-strong hover:shadow-2",
      ].join(" ")}
    >
      {/* Hairline here rather than the 2px used where a card is the subject of
          its page — a feed is twenty of these, and what reads as a highlight on
          one card reads as noise on twenty.

          The speed is derived from the event's own id, so neighbouring cards
          are never in step and the feed never pulses as one. */}
      <ShineBorder
        borderWidth={1}
        duration={13 + (event.event_id.charCodeAt(0) % 5)}
        shineColor={["#5b2545", "#d9b65c", "#d9a3c4"]}
      />
      {/* Flush to the card's edges — an image inset inside its own padding is
          what makes a card look like a slide rather than a page. */}
      {event.image_url && (
        <ArticleImage
          src={event.image_url}
          alt={event.representative_title}
          className={[
            "w-full object-cover",
            lead ? "h-56 sm:h-[22rem]" : "h-40",
          ].join(" ")}
        />
      )}

      <div className={["flex flex-col gap-3", lead ? "p-6 sm:gap-4" : "p-4"].join(" ")}>
      {event.topic && (
        <span className="text-xs font-semibold uppercase tracking-eyebrow text-amber">
          {event.topic}
        </span>
      )}

      <h3
        className={[
          "font-serif font-semibold text-balance transition-colors group-hover:text-brand",
          // Leading and tracking now travel with each size on the scale, so
          // they are no longer repeated here.
          lead ? "text-xl sm:text-2xl" : "text-md",
        ].join(" ")}
      >
        {event.representative_title}
      </h3>

      <p className="text-sm text-ink-dim">
        {event.article_count} {t.common.articles} · {event.source_count} {t.common.sources}
      </p>

      {/* The coverage, as a shape, with each position named inside its own
          segment. A story every outlet framed the same way reads as one solid
          band; a contested one reads as three or four. No legend needed. */}
      <BiasBar distribution={event.bias_distribution} size="xl" />

      <div className="flex flex-wrap gap-1.5">
        {event.sources.map((s) => (
          <SourceBadge key={s} name={s} />
        ))}
      </div>
      </div>
    </Link>
  );
}
