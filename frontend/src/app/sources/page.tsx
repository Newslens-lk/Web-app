import Link from "next/link";
import { getSources } from "@/lib/api";
import { SourceBadge } from "@/components/SourceBadge";
import { relativeTime } from "@/lib/api";
import { getDictionary } from "@/lib/i18n/server";

export default async function SourcesPage() {
  const t = getDictionary();
  const { sources } = await getSources();

  return (
    <div>
      <h1 className="font-serif text-[24px] font-semibold mb-6">{t.sources.title}</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sources.map((source) => (
          <Link
            key={source.source_name}
            href={`/articles?source=${encodeURIComponent(source.source_name)}`}
            className="bg-surface border border-rule rounded-[10px] p-5 flex flex-col gap-2 transition-shadow hover:border-rule-strong hover:shadow-card"
          >
            <SourceBadge name={source.source_name} />
            <div className="text-[13px] text-ink-dim mt-1">
              <p>
                <span className="font-mono tabular-nums font-semibold text-ink">
                  {source.article_count}
                </span>{" "}
                {t.sources.scraped}
              </p>
              <p className="mt-0.5">
                {t.sources.latest}{" "}
                {source.latest_article_at
                  ? relativeTime(source.latest_article_at, t)
                  : t.sources.noneYet}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {sources.length === 0 && (
        <p className="text-ink-dim text-center py-12">{t.sources.empty}</p>
      )}
    </div>
  );
}
