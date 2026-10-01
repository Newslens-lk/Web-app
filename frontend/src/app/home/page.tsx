import { Suspense, type CSSProperties } from "react";
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

  // The lead is the story the most outlets covered, which is also the story
  // where comparing framings is worth the reader's time. Sort is stable, so
  // ties keep the server's order and the newer story still wins.
  //
  // Only the first page gets a lead: promoting one story on page four would
  // claim an importance the position does not support.
  const onFirstPage = eventList.page === 1;
  const ranked = onFirstPage
    ? [...eventList.events].sort((a, b) => b.source_count - a.source_count)
    : eventList.events;
  const pageUrl = (page: number) => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (key !== "page" && value) query.set(key, value);
    }
    query.set("page", String(page));
    return `/home?${query.toString()}`;
  };

  return (
    <>
      <h1 className="edition-heading">{t.home.latestEvents}</h1>
      {/* The page arrives in three bands — what is here, how to narrow it,
          then the stories. Short delays: this is a page to read, not a cover,
          and anything slower would be in the way by the third visit. */}
      <p
        className="rise-in mb-7 font-mono text-sm uppercase tracking-eyebrow tabular-nums text-ink-faint"
        style={{ "--delay": "0ms" } as CSSProperties}
      >
        {stats.total_articles} {t.common.articles}
        <span className="mx-2 text-rule-strong">/</span>
        {stats.total_events} {t.common.events}
        <span className="mx-2 text-rule-strong">/</span>
        {stats.total_sources} {t.common.sources}
      </p>

      <div className="rise-in" style={{ "--delay": "80ms" } as CSSProperties}>
        <Suspense>
          <FilterBar />
        </Suspense>
      </div>

      {/* Two-column split on desktop: event feed left, widget rail right.
          Mobile stacks the rail below the feed. `minmax(0,1fr)` lets the feed
          column shrink below its content width, so long Sinhala headlines
          wrap instead of forcing the page to scroll sideways. */}
      <div
        className="rise-in grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]"
        style={{ "--delay": "160ms" } as CSSProperties}
      >
        <div>
          <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2 border-b-2 border-ink pb-2">
            <h2 className="font-serif text-base font-semibold uppercase tracking-eyebrow">
              {t.home.latestEvents}
            </h2>
            <span className="font-mono text-sm tabular-nums text-ink-faint">
              {t.home.totalAndPage(eventList.total, eventList.page)}
            </span>
          </div>

          {/* Keep the coverage ranking, with consistently compact cards. */}
          <div className="grid items-start gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {ranked.map((event) => (
              <EventCard key={event.event_id} event={event} />
            ))}
          </div>

          {eventList.events.length === 0 && (
            <p className="text-ink-dim text-center py-12">{t.home.noEvents}</p>
          )}

          {totalPages > 1 && (
            <nav aria-label={t.home.eventPages} className="mt-8 flex items-center justify-center gap-3 text-sm">
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
