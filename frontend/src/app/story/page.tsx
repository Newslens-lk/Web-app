import Link from "next/link";
import { ComingSoon } from "@/components/ComingSoon";
import { SpectrumBar } from "@/components/SpectrumBar";
import { OutletStack } from "@/components/OutletStack";
import { getEventDetail, relativeTime } from "@/lib/api";
import { events as mockEvents } from "@/lib/mock-events";

const biasBadgeClass: Record<string, string> = {
  left: "bg-spec-l",
  center: "bg-spec-c",
  right: "bg-spec-r",
};

type Props = { searchParams: { event?: string } };

export default async function StoryPage({ searchParams }: Props) {
  const eventId = searchParams.event;

  if (!eventId) {
    return (
      <ComingSoon
        title="Compare Story"
        blurb="Click an event on the home feed to see its live detail view."
      />
    );
  }

  let detail;
  try {
    detail = await getEventDetail(eventId);
  } catch (err) {
    console.warn(`Failed to load event ${eventId}:`, err);

    // The home feed falls back to mock events when the backend is unreachable,
    // so a card click can land here with a mock id instead of a real one.
    // Render the same demo data rather than a false "not found".
    const mockEvent = mockEvents.find((e) => e.id === eventId);
    if (mockEvent) {
      return (
        <div className="max-w-[70ch] py-8">
          <Link
            href="/"
            className="inline-block text-[13.5px] font-semibold text-brand hover:underline mb-4"
          >
            ← Back to feed
          </Link>

          <span className="text-[11px] font-bold tracking-[0.09em] uppercase text-amber">
            {mockEvent.topic}
          </span>
          <h1 className="font-serif text-[28px] font-semibold leading-[1.2] text-balance mt-1.5">
            {mockEvent.headline}
          </h1>
          <p className="text-[13px] text-ink-dim mt-2">{mockEvent.dek}</p>
          <p className="text-[12px] text-amber mt-2">
            Backend unreachable — showing illustrative demo data, not real bias assessments.
          </p>

          <SpectrumBar distribution={mockEvent.distribution} size="lg" className="mt-5" />
          <div className="flex items-center gap-2 mt-3">
            <OutletStack outlets={mockEvent.outlets} limit={mockEvent.outlets.length} />
            <span className="text-[12px] text-ink-faint">
              {mockEvent.outletCount} outlets · updated {mockEvent.updatedAgo}
            </span>
          </div>
        </div>
      );
    }

    return (
      <ComingSoon
        title="Story not found"
        blurb="This event couldn't be loaded from the backend — it may not exist, or the API may be unreachable."
      />
    );
  }

  const headline = detail.summary ?? detail.articles[0]?.title ?? "Untitled event";

  return (
    <div className="max-w-[70ch] py-8">
      <Link
        href="/"
        className="inline-block text-[13.5px] font-semibold text-brand hover:underline mb-4"
      >
        ← Back to feed
      </Link>

      <span className="text-[11px] font-bold tracking-[0.09em] uppercase text-amber">
        {detail.topic ?? "General"}
      </span>
      <h1 className="font-serif text-[28px] font-semibold leading-[1.2] text-balance mt-1.5">
        {headline}
      </h1>
      <p className="text-[13px] text-ink-faint mt-2">
        {detail.article_count} article{detail.article_count === 1 ? "" : "s"} ·{" "}
        {detail.source_count} outlet{detail.source_count === 1 ? "" : "s"} · updated{" "}
        {relativeTime(detail.window_end)}
      </p>

      <div className="mt-6 flex flex-col gap-3">
        {detail.articles.map((article) => (
          <a
            key={article.article_id}
            href={article.url}
            target="_blank"
            rel="noreferrer"
            className="block bg-surface border border-rule rounded-[10px] p-4 hover:border-rule-strong transition-colors"
          >
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-[12.5px] font-semibold text-ink-dim">
                {article.source_name}
              </span>
              {article.bias_label && (
                <span
                  className={`text-[10.5px] font-bold uppercase tracking-wide text-white px-2 py-[3px] rounded ${
                    biasBadgeClass[article.bias_label] ?? "bg-surface-3 text-ink-dim"
                  }`}
                >
                  {article.bias_label}
                </span>
              )}
            </div>
            <h3 className="font-serif text-[16px] font-semibold leading-snug text-balance">
              {article.title}
            </h3>
            <p className="text-[12px] text-ink-faint mt-1">
              {article.language} ·{" "}
              {article.published_at ? relativeTime(article.published_at) : "date unknown"}
            </p>
          </a>
        ))}
      </div>
    </div>
  );
}
