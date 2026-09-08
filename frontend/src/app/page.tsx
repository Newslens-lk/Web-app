import { Suspense } from "react";
import { FilterBar } from "@/components/FilterBar";
import { EventCard } from "@/components/EventCard";
import { DigitalClock } from "@/components/DigitalClock";
import { WeatherWidget } from "@/components/WeatherWidget";
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

      {/* Two-column split on desktop: event feed left, widget rail right.
          Mobile stacks the rail below the feed. `minmax(0,1fr)` lets the feed
          column shrink below its content width, so long Sinhala headlines
          wrap instead of forcing the page to scroll sideways. */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div>
          <div className="flex justify-between items-baseline flex-wrap gap-2 mb-4">
            <h2 className="font-serif text-[20px] font-semibold text-balance">
              Latest events
            </h2>
            <span className="text-[13px] text-ink-dim">
              {eventList.total} total · page {eventList.page}
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {eventList.events.map((event) => (
              <EventCard key={event.event_id} event={event} />
            ))}
          </div>

          {eventList.events.length === 0 && (
            <p className="text-ink-dim text-center py-12">No events found.</p>
          )}
        </div>

        {/* Ambient widgets. Sticky so they stay in view while the feed
            scrolls; `self-start` stops the rail stretching to feed height.
            Further widgets go here. */}
        <aside
          aria-label="At a glance"
          className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start"
        >
          <DigitalClock />
          <WeatherWidget />
        </aside>
      </div>
    </>
  );
}
