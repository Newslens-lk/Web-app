import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticleDetail, getSimilarArticles, relativeTime } from "@/lib/api";
import { BiasLabel } from "@/components/BiasLabel";
import { SourceBadge } from "@/components/SourceBadge";
import { BIAS_LABELS, BIAS_COLORS } from "@/lib/constants";
import { getDictionary } from "@/lib/i18n/server";
import { ArticleImage } from "@/components/ArticleImage";

type Props = { params: { articleId: string } };

export default async function ArticleDetailPage({ params }: Props) {
  const t = getDictionary();
  let article;
  try {
    article = await getArticleDetail(params.articleId);
  } catch {
    notFound();
  }

  let similar: Awaited<ReturnType<typeof getSimilarArticles>>["similar_articles"] = [];
  try {
    const res = await getSimilarArticles(params.articleId);
    similar = res.similar_articles;
  } catch {
    // vector search may not be available
  }

  return (
    <div className="rise-in max-w-[70ch] py-4">
      {article.event_id && (
        <Link
          href={`/events/${article.event_id}`}
          className="inline-block text-sm font-semibold text-brand hover:underline mb-4"
        >
          &larr; {t.article.backToEvent}
        </Link>
      )}

      <div className="mb-3 flex flex-wrap items-center gap-3">
        <SourceBadge name={article.source_name} size="md" showName />
        <BiasLabel label={article.bias_label} confidence={article.bias_confidence} />
      </div>

      <h1 className="font-serif text-xl font-semibold leading-[1.2] text-balance">
        {article.title}
      </h1>

      <p className="text-sm text-ink-faint mt-2">
        {t.article.published}{" "}
        {article.published_at ? relativeTime(article.published_at, t) : t.common.dateUnknown}
        {article.scraped_at && (
          <> · {t.article.scraped} {relativeTime(article.scraped_at, t)}</>
        )}
        {" · "}
        <a
          href={article.url}
          target="_blank"
          rel="noreferrer"
          className="text-brand font-semibold hover:underline"
        >
          {t.common.readOriginal} &nearr;
        </a>
      </p>

      <ArticleImage
        src={article.image_url}
        alt={article.title}
        className="mt-6 max-h-[420px] w-full rounded-[3px] object-cover"
      />

      {article.bias_scores && (
        <div className="mt-6 bg-surface border border-rule rounded-[3px] p-4 shadow-1">
          <h2 className="text-sm font-semibold text-ink-dim mb-3">{t.article.scoreBreakdown}</h2>
          <div className="flex flex-col gap-2">
            {BIAS_LABELS.map((label) => {
              const score = article.bias_scores![label] ?? 0;
              return (
                <div key={label} className="flex items-center gap-2 text-sm">
                  <span className="w-20 text-right text-ink-dim">{t.bias[label]}</span>
                  <div className="flex-1 h-5 bg-surface-2 rounded overflow-hidden">
                    <div
                      className="h-full rounded"
                      style={{
                        width: `${Math.round(score * 100)}%`,
                        backgroundColor: BIAS_COLORS[label],
                      }}
                    />
                  </div>
                  <span className="font-mono text-sm w-12 text-right">
                    {Math.round(score * 100)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-6 font-serif text-base leading-relaxed whitespace-pre-line">
        {article.body}
      </div>

      {similar.length > 0 && (
        <div className="mt-10">
          <h2 className="text-base font-semibold mb-4">{t.article.similar}</h2>
          <div className="flex flex-col gap-3">
            {similar.map((s) => (
              <Link
                key={s.article_id}
                href={`/articles/${s.article_id}`}
                className="bg-surface border border-rule rounded-[3px] p-3 shadow-1 transition-[box-shadow,border-color] duration-200 hover:border-rule-strong hover:shadow-2 flex items-center justify-between gap-3"
              >
                <div>
                  <span className="text-sm text-ink-faint">{s.source_name}</span>
                  <h3 className="text-base font-semibold leading-snug">{s.title}</h3>
                </div>
                <BiasLabel label={s.bias_label} />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
