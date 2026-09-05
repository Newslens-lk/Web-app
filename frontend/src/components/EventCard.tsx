import Link from "next/link";
import type { EventSummary } from "@/lib/types";
import { relativeTime } from "@/lib/api";
import { SourceBadge } from "./SourceBadge";

type Props = { event: EventSummary };

export function EventCard({ event }: Props) {
  return (
    <Link
      href={`/events/${event.event_id}`}
      className="group bg-surface border border-rule rounded-[10px] p-[18px] flex flex-col gap-2.5 text-left transition-shadow transition-colors hover:border-rule-strong hover:shadow-card"
    >
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
      <div className="flex flex-wrap gap-1">
        {event.sources.map((s) => (
          <SourceBadge key={s} name={s} />
        ))}
      </div>
    </Link>
  );
}
