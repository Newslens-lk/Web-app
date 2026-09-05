import { Suspense } from "react";
import { FilterBar } from "@/components/FilterBar";
import { EventCard } from "@/components/EventCard";
import { getEvents, getStats } from "@/lib/api";

type Props = { searchParams: Record<string, string | undefined> };

export default async function HomePage({ searchParams }: Props) {
  const params: Record<string, string> = {};
  if (searchParams.source) params.source = searchParams.source;
  if (searchParams.min_sources) params.min_sources = searchParams.min_sources;
  if (searchParams.page) params.page = searchParams.page;

  const [eventList, stats] = await Promise.all([
    getEvents(params),
    getStats(),
  ]);

  return (
    <>
      <div className="bg-surface-2 border border-rule rounded-lg px-5 py-3 mb-6 flex flex-wrap gap-x-6 gap-y-1 text-[13px]">
        <span>
          <span className="font-mono tabular-nums font-semibold">{stats.total_articles}</span>{" "}
          articles
        </span>
        <span>
          <span className="font-mono tabular-nums font-semibold">{stats.total_events}</span>{" "}
          events
        </span>
        <span>
          <span className="font-mono tabular-nums font-semibold">{stats.total_sources}</span>{" "}
          sources
        </span>
      </div>

      <Suspense>
        <FilterBar />
      </Suspense>

      <div className="flex justify-between items-baseline flex-wrap gap-2 mb-4">
        <h2 className="font-serif text-[20px] font-semibold text-balance">
          Latest events
        </h2>
        <span className="text-[13px] text-ink-dim">
          {eventList.total} total · page {eventList.page}
        </span>
      </div>

      <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(300px,1fr))]">
        {eventList.events.map((event) => (
          <EventCard key={event.event_id} event={event} />
        ))}
      </div>

      {eventList.events.length === 0 && (
        <p className="text-ink-dim text-center py-12">No events found.</p>
      )}
    </>
  );
}
