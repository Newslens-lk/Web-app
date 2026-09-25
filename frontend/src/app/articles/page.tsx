import Link from "next/link";

import { getArticles, relativeTime } from "@/lib/api";
import { SourceBadge } from "@/components/SourceBadge";

type Props = { searchParams: Record<string, string | undefined> };

export default async function ArticlesPage({ searchParams }: Props) {
  const source = searchParams.source;
  const page = Number(searchParams.page ?? "1") || 1;
  const result = await getArticles({
    ...(source ? { source } : {}),
    page: String(page),
  });
  const totalPages = Math.ceil(result.total / result.page_size);

  const pageUrl = (nextPage: number) => {
    const query = new URLSearchParams();
    if (source) query.set("source", source);
    query.set("page", String(nextPage));
    return `/articles?${query.toString()}`;
  };

  return (
    <div>
      <Link href="/sources" className="text-[13px] font-semibold text-brand hover:underline">
        ← Back to Sources
      </Link>

      <div className="mt-5 mb-6">
        <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-amber">
          Raw scraped news
        </p>
        <h1 className="mt-2 font-serif text-[28px] font-semibold">
          {source ? `${source} articles` : "All articles"}
        </h1>
        <p className="mt-2 text-[14px] text-ink-dim">
          These are individual articles collected before event clustering.
        </p>
      </div>

      <div className="space-y-3">
        {result.articles.map((article) => (
          <article key={article.article_id} className="rounded-lg border border-rule bg-surface p-4">
            <div className="flex flex-wrap items-center gap-2">
              <SourceBadge name={article.source_name} />
              {article.bias_label && (
                <span className="text-[12px] font-semibold text-ink-dim">
                  {article.bias_label.replaceAll("_", " ")}
                </span>
              )}
            </div>
            <h2 className="mt-2 font-serif text-[18px] font-semibold leading-snug">
              {article.title}
            </h2>
            <p className="mt-2 text-[13px] text-ink-dim">
              {relativeTime(article.published_at)}
            </p>
            <div className="mt-3 flex gap-4 text-[13px] font-semibold">
              <Link href={`/articles/${article.article_id}`} className="text-brand hover:underline">
                Details
              </Link>
              <a href={article.url} target="_blank" rel="noreferrer" className="text-brand hover:underline">
                Read original ↗
              </a>
            </div>
          </article>
        ))}
      </div>

      {result.articles.length === 0 && (
        <p className="py-12 text-center text-ink-dim">No raw articles found.</p>
      )}

      {totalPages > 1 && (
        <nav aria-label="Article pages" className="mt-8 flex items-center justify-center gap-3 text-[13px]">
          {page > 1 ? (
            <Link href={pageUrl(page - 1)} className="rounded-md border border-rule-strong bg-surface px-3 py-2 font-semibold text-ink-dim hover:bg-surface-2">
              Previous
            </Link>
          ) : (
            <span className="rounded-md border border-rule bg-surface-2 px-3 py-2 text-ink-faint">Previous</span>
          )}
          <span className="text-ink-dim">Page {page} of {totalPages}</span>
          {page < totalPages ? (
            <Link href={pageUrl(page + 1)} className="rounded-md border border-rule-strong bg-surface px-3 py-2 font-semibold text-ink-dim hover:bg-surface-2">
              Next
            </Link>
          ) : (
            <span className="rounded-md border border-rule bg-surface-2 px-3 py-2 text-ink-faint">Next</span>
          )}
        </nav>
      )}
    </div>
  );
}
