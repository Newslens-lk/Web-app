import { Suspense } from "react";
import Link from "next/link";
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

  const totalPages = Math.ceil(eventList.total / eventList.page_size);
  const pageUrl = (page: number) => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (key !== "page" && value) query.set(key, value);
    }
    query.set("page", String(page));
    return `/?${query.toString()}`;
  };

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

      {totalPages > 1 && (
        <nav aria-label="Event pages" className="mt-8 flex items-center justify-center gap-3 text-[13px]">
          {eventList.page > 1 ? (
            <Link
              href={pageUrl(eventList.page - 1)}
              className="rounded-md border border-rule-strong bg-surface px-3 py-2 font-semibold text-ink-dim hover:bg-surface-2 hover:text-ink"
            >
              Previous
            </Link>
          ) : (
            <span className="rounded-md border border-rule bg-surface-2 px-3 py-2 text-ink-faint">
              Previous
            </span>
          )}

          <span className="text-ink-dim">
            Page {eventList.page} of {totalPages}
          </span>

          {eventList.page < totalPages ? (
            <Link
              href={pageUrl(eventList.page + 1)}
              className="rounded-md border border-rule-strong bg-surface px-3 py-2 font-semibold text-ink-dim hover:bg-surface-2 hover:text-ink"
            >
              Next
            </Link>
          ) : (
            <span className="rounded-md border border-rule bg-surface-2 px-3 py-2 text-ink-faint">
              Next
            </span>
          )}
        </nav>
      )}
    </>
  );
}
