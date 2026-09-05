import { FilterBar } from "@/components/FilterBar";
import { EventCard } from "@/components/EventCard";
import { events as mockEvents, type Event } from "@/lib/mock-events";
import { getEventDetail, getEventSummaries, toUiEvent } from "@/lib/api";

async function loadEvents(): Promise<Event[]> {
  try {
    const summaries = await getEventSummaries();
    const details = await Promise.all(
      summaries.map((summary) => getEventDetail(summary.event_id)),
    );
    return details.map(toUiEvent);
  } catch (err) {
    console.warn("Backend unreachable, falling back to mock events:", err);
    return mockEvents;
  }
}

export default async function HomePage() {
  const events = await loadEvents();
  const outletCount = new Set(
    events.flatMap((event) => event.outlets.map((outlet) => outlet.name)),
  ).size;

  return (
    <>
      <FilterBar />

      <div className="flex justify-between items-baseline flex-wrap gap-2 mb-4">
        <h2 className="font-serif text-[20px] font-semibold text-balance">
          Today&apos;s top stories
        </h2>
        <span className="text-[13px] text-ink-dim">
          <span className="font-mono tabular-nums">{events.length}</span> events
          · <span className="font-mono tabular-nums">{outletCount}</span> outlets tracked
        </span>
      </div>

      <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(300px,1fr))]">
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </>
  );
}
