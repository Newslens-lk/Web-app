import { getSources } from "@/lib/api";
import { SourceBadge } from "@/components/SourceBadge";
import { relativeTime } from "@/lib/api";

export default async function SourcesPage() {
  const { sources } = await getSources();

  return (
    <div>
      <h1 className="font-serif text-[24px] font-semibold mb-6">Sources</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sources.map((source) => (
          <div
            key={source.source_name}
            className="bg-surface border border-rule rounded-[10px] p-5 flex flex-col gap-2"
          >
            <SourceBadge name={source.source_name} />
            <div className="text-[13px] text-ink-dim mt-1">
              <p>
                <span className="font-mono tabular-nums font-semibold text-ink">
                  {source.article_count}
                </span>{" "}
                articles scraped
              </p>
              <p className="mt-0.5">
                Latest:{" "}
                {source.latest_article_at
                  ? relativeTime(source.latest_article_at)
                  : "none yet"}
              </p>
            </div>
          </div>
        ))}
      </div>

      {sources.length === 0 && (
        <p className="text-ink-dim text-center py-12">No sources found.</p>
      )}
    </div>
  );
}
