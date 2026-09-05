import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticleDetail, getSimilarArticles, relativeTime } from "@/lib/api";
import { BiasLabel } from "@/components/BiasLabel";
import { SourceBadge } from "@/components/SourceBadge";
import { BIAS_LABELS, BIAS_DISPLAY, BIAS_COLORS } from "@/lib/constants";

type Props = { params: { articleId: string } };

export default async function ArticleDetailPage({ params }: Props) {
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
    <div className="max-w-[70ch] py-4">
      {article.event_id && (
        <Link
          href={`/events/${article.event_id}`}
          className="inline-block text-[13.5px] font-semibold text-brand hover:underline mb-4"
        >
          &larr; Back to Event
        </Link>
      )}

      <div className="flex items-center gap-2 mb-3">
        <SourceBadge name={article.source_name} />
        <BiasLabel label={article.bias_label} confidence={article.bias_confidence} />
      </div>

      <h1 className="font-serif text-[26px] font-semibold leading-[1.2] text-balance">
        {article.title}
      </h1>

      <p className="text-[13px] text-ink-faint mt-2">
        Published {article.published_at ? relativeTime(article.published_at) : "date unknown"}
        {article.scraped_at && <> · Scraped {relativeTime(article.scraped_at)}</>}
        {" · "}
        <a
          href={article.url}
          target="_blank"
          rel="noreferrer"
          className="text-brand font-semibold hover:underline"
        >
          Read Original &nearr;
        </a>
      </p>

      {article.bias_scores && (
        <div className="mt-6 bg-surface border border-rule rounded-lg p-4">
          <h2 className="text-[13px] font-semibold text-ink-dim mb-3">Bias Score Breakdown</h2>
          <div className="flex flex-col gap-2">
            {BIAS_LABELS.map((label) => {
              const score = article.bias_scores![label] ?? 0;
              return (
                <div key={label} className="flex items-center gap-2 text-[13px]">
                  <span className="w-20 text-right text-ink-dim">{BIAS_DISPLAY[label]}</span>
                  <div className="flex-1 h-5 bg-surface-2 rounded overflow-hidden">
                    <div
                      className="h-full rounded"
                      style={{
                        width: `${Math.round(score * 100)}%`,
                        backgroundColor: BIAS_COLORS[label],
                      }}
                    />
                  </div>
                  <span className="font-mono text-[12px] w-12 text-right">
                    {Math.round(score * 100)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-6 font-serif text-[15px] leading-relaxed whitespace-pre-line">
        {article.body}
      </div>

      {similar.length > 0 && (
        <div className="mt-10">
          <h2 className="text-[15px] font-semibold mb-4">Similar Articles</h2>
          <div className="flex flex-col gap-3">
            {similar.map((s) => (
              <Link
                key={s.article_id}
                href={`/articles/${s.article_id}`}
                className="bg-surface border border-rule rounded-lg p-3 hover:border-rule-strong transition-colors flex items-center justify-between gap-3"
              >
                <div>
                  <span className="text-[12px] text-ink-faint">{s.source_name}</span>
                  <h3 className="text-[14px] font-semibold leading-snug">{s.title}</h3>
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
