import Link from "next/link";

import { getArticles, relativeTime } from "@/lib/api";
import { BiasLabel } from "@/components/BiasLabel";
import { ArticleFilters } from "@/components/ArticleFilters";
import { ArticleImage } from "@/components/ArticleImage";
import { ImagelessPanel } from "@/components/ImagelessPanel";
import { sourceDisplayName } from "@/lib/constants";
import { getDictionary } from "@/lib/i18n/server";
import type { BiasLabel as BiasLabelType } from "@/lib/types";

type Props = { searchParams: Record<string, string | undefined> };

export default async function ArticlesPage({ searchParams }: Props) {
  const t = getDictionary();
  const source = searchParams.source;
  const biasLabel = searchParams.bias_label;
  const search = searchParams.search;
  const dateFrom = searchParams.date_from;
  const dateTo = searchParams.date_to;
  const page = Number(searchParams.page ?? "1") || 1;
  const result = await getArticles({
    ...(source ? { source } : {}),
    ...(biasLabel ? { bias_label: biasLabel } : {}),
    ...(search ? { search } : {}),
    ...(dateFrom ? { date_from: dateFrom } : {}),
    ...(dateTo ? { date_to: dateTo } : {}),
    page: String(page),
  });
  const totalPages = Math.ceil(result.total / result.page_size);

  const pageUrl = (nextPage: number) => {
    const query = new URLSearchParams();
    if (source) query.set("source", source);
    if (biasLabel) query.set("bias_label", biasLabel);
    if (search) query.set("search", search);
    if (dateFrom) query.set("date_from", dateFrom);
    if (dateTo) query.set("date_to", dateTo);
    query.set("page", String(nextPage));
    return `/articles?${query.toString()}`;
  };

  return (
    <div className="rise-in">
      <Link href="/sources" className="text-sm font-semibold text-brand hover:underline">
        ← {t.articles.backToSources}
      </Link>

      <div className="mt-4 mb-6">
        <h1 className="font-serif text-xl font-semibold">
          {biasLabel
            ? t.articles.filtered(t.bias[biasLabel as BiasLabelType] ?? biasLabel.replaceAll("_", " "))
            : source
              ? t.articles.filtered(sourceDisplayName(source))
              : t.articles.allArticles}
        </h1>
        <p className="mt-1 text-sm text-ink-dim">{t.articles.count(result.total)}</p>
      </div>

      <ArticleFilters
        search={search}
        source={source}
        biasLabel={biasLabel}
        dateFrom={dateFrom}
        dateTo={dateTo}
      />

      <div className="grid gap-x-8 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
        {result.articles.map((article) => (
          <article
            key={article.article_id}
            className="editorial-story group relative overflow-hidden border-b border-rule pb-6"
          >
            <ArticleImage
              src={article.image_url}
              alt={article.title}
              className="mb-5 h-56 w-full rounded-md object-cover"
              fallback={
                <ImagelessPanel
                  title={article.title}
                  source={article.source_name}
                  biasLabel={article.bias_label}
                  className="mb-5 h-56 w-full rounded-md"
                />
              }
            />
            <div className="flex flex-wrap items-center gap-2">
              <BiasLabel label={article.bias_label} confidence={article.bias_confidence} />
            </div>
            <h2 className="mt-2 font-serif text-md font-semibold leading-snug group-has-[[data-imageless]]:hidden">
              {article.title}
            </h2>
            {article.body_excerpt && (
              <p className="mt-2 text-base leading-relaxed text-ink-dim">
                {article.body_excerpt}
                {article.body_excerpt.length >= 320 ? "…" : ""}
              </p>
            )}
            <p className="mt-2 text-sm text-ink-dim">
              {relativeTime(article.published_at, t)}
            </p>
            <div className="mt-3 flex gap-4 text-sm font-semibold">
              <Link href={`/articles/${article.article_id}`} className="text-brand hover:underline">
                {t.common.details}
              </Link>
              <a href={article.url} target="_blank" rel="noreferrer" className="text-brand hover:underline">
                {t.common.readOriginal} ↗
              </a>
            </div>
          </article>
        ))}
      </div>

      {result.articles.length === 0 && (
        <p className="py-12 text-center text-ink-dim">{t.articles.empty}</p>
      )}

      {totalPages > 1 && (
        <nav aria-label={t.articles.pages} className="mt-8 flex items-center justify-center gap-3 text-sm">
          {page > 1 ? (
            <Link href={pageUrl(page - 1)} className="rounded-md border border-rule-strong bg-surface px-3 py-2 font-semibold text-ink-dim hover:bg-surface-2">
              {t.common.previous}
            </Link>
          ) : (
            <span className="rounded-md border border-rule bg-surface-2 px-3 py-2 text-ink-faint">{t.common.previous}</span>
          )}
          <span className="text-ink-dim">{t.common.pageOf(page, totalPages)}</span>
          {page < totalPages ? (
            <Link href={pageUrl(page + 1)} className="rounded-md border border-rule-strong bg-surface px-3 py-2 font-semibold text-ink-dim hover:bg-surface-2">
              {t.common.next}
            </Link>
          ) : (
            <span className="rounded-md border border-rule bg-surface-2 px-3 py-2 text-ink-faint">{t.common.next}</span>
          )}
        </nav>
      )}
    </div>
  );
}
