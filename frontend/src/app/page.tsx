import { Suspense } from "react";
import Link from "next/link";
import { FilterBar } from "@/components/FilterBar";
import { EventCard } from "@/components/EventCard";
import { DigitalClock } from "@/components/DigitalClock";
import { WeatherWidget } from "@/components/WeatherWidget";
import { getEvents, getStats } from "@/lib/api";
import { getDictionary } from "@/lib/i18n/server";

type Props = { searchParams: Record<string, string | undefined> };

export default async function HomePage({ searchParams }: Props) {
  const t = getDictionary();
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
          {t.common.articles}
        </span>
        <span>
          <span className="font-mono tabular-nums font-semibold">{stats.total_events}</span>{" "}
          {t.common.events}
        </span>
        <span>
          <span className="font-mono tabular-nums font-semibold">{stats.total_sources}</span>{" "}
          {t.common.sources}
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
              {t.home.latestEvents}
            </h2>
            <span className="text-[13px] text-ink-dim">
              {t.home.totalAndPage(eventList.total, eventList.page)}
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {eventList.events.map((event) => (
              <EventCard key={event.event_id} event={event} />
            ))}
          </div>

          {eventList.events.length === 0 && (
            <p className="text-ink-dim text-center py-12">{t.home.noEvents}</p>
          )}

          {totalPages > 1 && (
            <nav aria-label={t.home.eventPages} className="mt-8 flex items-center justify-center gap-3 text-[13px]">
              {eventList.page > 1 ? (
                <Link
                  href={pageUrl(eventList.page - 1)}
                  className="rounded-md border border-rule-strong bg-surface px-3 py-2 font-semibold text-ink-dim hover:bg-surface-2 hover:text-ink"
                >
                  {t.common.previous}
                </Link>
              ) : (
                <span className="rounded-md border border-rule bg-surface-2 px-3 py-2 text-ink-faint">
                  {t.common.previous}
                </span>
              )}

              <span className="text-ink-dim">
                {t.common.pageOf(eventList.page, totalPages)}
              </span>

              {eventList.page < totalPages ? (
                <Link
                  href={pageUrl(eventList.page + 1)}
                  className="rounded-md border border-rule-strong bg-surface px-3 py-2 font-semibold text-ink-dim hover:bg-surface-2 hover:text-ink"
                >
                  {t.common.next}
                </Link>
              ) : (
                <span className="rounded-md border border-rule bg-surface-2 px-3 py-2 text-ink-faint">
                  {t.common.next}
                </span>
              )}
            </nav>
          )}
        </div>

        {/* Ambient widgets. Sticky so they stay in view while the feed
            scrolls; `self-start` stops the rail stretching to feed height.
            Further widgets go here. */}
        <aside
          aria-label={t.home.atAGlance}
          className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start"
        >
          <DigitalClock />
          <WeatherWidget />
        </aside>
      </div>
    </>
  );
}
