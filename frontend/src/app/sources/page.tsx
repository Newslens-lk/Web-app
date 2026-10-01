import Link from "next/link";
import { getSources } from "@/lib/api";
import { ShineBorder } from "@/components/ShineBorder";
import { SourceBadge } from "@/components/SourceBadge";
import { relativeTime } from "@/lib/api";
import { getDictionary } from "@/lib/i18n/server";

export default async function SourcesPage() {
  const t = getDictionary();
  const { sources } = await getSources();

  return (
    <div className="rise-in">
      <h1 className="font-serif text-lg font-semibold mb-6">{t.sources.title}</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sources.map((source, i) => (
          <Link
            key={source.source_name}
            href={`/articles?source=${encodeURIComponent(source.source_name)}`}
            className="relative flex flex-col gap-2 overflow-hidden rounded-[3px] border border-rule bg-surface p-5 shadow-1 transition-[box-shadow,transform,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-rule-strong hover:shadow-2"
          >
            {/* Each card runs a second longer than the one before it. Identical
                durations would put all five in lockstep, which reads as one
                mechanism rather than five separate outlets. */}
            <ShineBorder
              borderWidth={2}
              duration={11 + i}
              shineColor={["#5b2545", "#d9b65c", "#d9a3c4"]}
            />
            {/* Tile and name on one line, everything about the outlet indented
                under the name — so the eye runs down the column of tiles and
                the detail hangs off it, rather than each card starting over. */}
            <SourceBadge name={source.source_name} size="lg" showName />
            <div className="mt-1 pl-[54px] text-sm text-ink-dim">
              <p>
                <span className="font-mono font-semibold tabular-nums text-ink">
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
