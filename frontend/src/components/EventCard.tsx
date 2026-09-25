import Link from "next/link";
import type { EventSummary } from "@/lib/types";
import { relativeTime } from "@/lib/api";
import { BIAS_COLORS, BIAS_DISPLAY, BIAS_LABELS } from "@/lib/constants";
import { SourceBadge } from "./SourceBadge";
import { ArticleImage } from "./ArticleImage";

type Props = { event: EventSummary };

export function EventCard({ event }: Props) {
  return (
    <Link
      href={`/events/${event.event_id}`}
      className="group bg-surface border border-rule rounded-[10px] p-[18px] flex flex-col gap-2.5 text-left transition-shadow transition-colors hover:border-rule-strong hover:shadow-card"
    >
      <ArticleImage
        src={event.image_url}
        alt={event.representative_title}
        className="h-40 w-full rounded-md object-cover"
      />
      {event.topic && (
        <span className="text-[11px] font-bold tracking-[0.09em] uppercase text-amber">
          {event.topic}
        </span>
      )}
      <h3 className="font-serif text-[17.5px] font-semibold leading-[1.28] text-balance">
        {event.representative_title}
      </h3>
      <p className="text-[13px] text-ink-dim leading-snug">
        {event.article_count} article{event.article_count !== 1 && "s"} · {event.source_count} source{event.source_count !== 1 && "s"} · {relativeTime(event.window_end)}
      </p>
      <div
        className="mt-1 flex h-2.5 w-full overflow-hidden rounded-full bg-surface-2"
        role="img"
        aria-label="Bias distribution"
        title={BIAS_LABELS
          .map((label) => `${BIAS_DISPLAY[label]}: ${event.bias_distribution[label]}`)
          .join(" · ")}
      >
        {BIAS_LABELS.map((label) => {
          const count = event.bias_distribution[label];
          if (!count || !event.article_count) return null;
          return (
            <span
              key={label}
              className="h-full"
              style={{
                width: `${(count / event.article_count) * 100}%`,
                backgroundColor: BIAS_COLORS[label],
              }}
            />
          );
        })}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-ink-dim">
        {BIAS_LABELS.map((label) => (
          <span key={label} className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: BIAS_COLORS[label] }} />
            {BIAS_DISPLAY[label]} ({event.bias_distribution[label]})
          </span>
        ))}
      </div>
      <div className="flex flex-wrap gap-1">
        {event.sources.map((s) => (
          <SourceBadge key={s} name={s} />
        ))}
      </div>
    </Link>
  );
}
