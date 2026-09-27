import Link from "next/link";
import { notFound } from "next/navigation";
import { getEventDetail, relativeTime } from "@/lib/api";
import { BiasBar } from "@/components/BiasBar";
import { BiasLabel } from "@/components/BiasLabel";
import { SourceBadge } from "@/components/SourceBadge";
import { BIAS_LABELS, BIAS_COLORS } from "@/lib/constants";
import { getDateLocale, getDictionary } from "@/lib/i18n/server";
import { ArticleImage } from "@/components/ArticleImage";

type Props = { params: { eventId: string } };

export default async function EventDetailPage({ params }: Props) {
  const t = getDictionary();
  const dateLocale = getDateLocale();
  let detail;
  try {
    detail = await getEventDetail(params.eventId);
  } catch {
    notFound();
  }

  const headline = detail.summary ?? detail.articles[0]?.title ?? t.event.untitled;

  return (
    <div className="max-w-[900px] py-4">
      <Link
        href="/"
        className="inline-block text-[13.5px] font-semibold text-brand hover:underline mb-4"
      >
        &larr; {t.event.backToEvents}
      </Link>

      <h1 className="font-serif text-[28px] font-semibold leading-[1.2] text-balance">
        {headline}
      </h1>
      <p className="text-[13px] text-ink-faint mt-2">
        {t.event.meta(
          detail.article_count,
          detail.source_count,
          detail.window_start
            ? new Date(detail.window_start).toLocaleDateString(dateLocale, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "",
        )}
      </p>

      <div className="mt-6">
        <h2 className="text-[13px] font-semibold text-ink-dim mb-2">{t.event.heading}</h2>
        <BiasBar distribution={detail.bias_distribution} size="lg" />
        <div className="flex flex-wrap gap-3 mt-2 text-[12px]">
          {BIAS_LABELS.map((label) => (
            <span key={label} className="flex items-center gap-1">
              <span
                className="inline-block w-2.5 h-2.5 rounded-sm"
                style={{ backgroundColor: BIAS_COLORS[label] }}
              />
              {t.bias[label]} ({detail.bias_distribution[label] ?? 0})
            </span>
          ))}
        </div>
      </div>

      <h2 className="text-[15px] font-semibold mt-8 mb-4">{t.event.articles}</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {detail.articles.map((article) => (
          <div
            key={article.article_id}
            className="bg-surface border border-rule rounded-[10px] p-4 flex flex-col gap-2"
          >
            <ArticleImage
              src={article.image_url}
              alt={article.title}
              className="h-40 w-full rounded-md object-cover"
            />
            <div className="flex items-center justify-between gap-2">
              <SourceBadge name={article.source_name} />
              <BiasLabel
                label={article.bias_label}
                confidence={article.bias_confidence}
              />
            </div>
            <h3 className="font-serif text-[16px] font-semibold leading-snug text-balance">
              {article.title}
            </h3>
            <p className="text-[13px] text-ink-dim leading-relaxed line-clamp-4">
              {article.body.slice(0, 200)}
              {article.body.length > 200 && "…"}
            </p>
            <div className="flex items-center justify-between mt-auto pt-2 text-[12px] text-ink-faint">
              <span>
                {article.published_at
                  ? relativeTime(article.published_at, t)
                  : t.common.dateUnknown}
              </span>
              <div className="flex gap-2">
                <Link
                  href={`/articles/${article.article_id}`}
                  className="text-brand font-semibold hover:underline"
                >
                  {t.common.details}
                </Link>
                <a
                  href={article.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand font-semibold hover:underline"
                >
                  {t.common.readOriginal} &nearr;
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
