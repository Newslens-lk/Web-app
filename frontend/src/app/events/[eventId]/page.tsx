import Link from "next/link";
import { notFound } from "next/navigation";
import { getEventDetail, relativeTime } from "@/lib/api";
import { BiasBar } from "@/components/BiasBar";
import { BiasLabel } from "@/components/BiasLabel";
import { SourceBadge } from "@/components/SourceBadge";
import { getDateLocale, getDictionary } from "@/lib/i18n/server";
import { ArticleImage } from "@/components/ArticleImage";
import { ShineBorder } from "@/components/ShineBorder";

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
    <div className="rise-in max-w-[900px] py-4">
      <Link
        href="/home"
        className="inline-block text-sm font-semibold text-brand hover:underline mb-4"
      >
        &larr; {t.event.backToEvents}
      </Link>

      <h1 className="font-serif text-xl font-semibold leading-[1.2] text-balance">
        {headline}
      </h1>
      <p className="text-sm text-ink-faint mt-2">
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

      <div className="mt-7">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-eyebrow text-ink-dim">
          {t.event.heading}
        </h2>
        {/* The legend that used to sit under this bar is gone: the bar names
            its own segments now, and repeating all five underneath listed
            positions this story does not contain. */}
        <BiasBar distribution={detail.bias_distribution} size="xl" />
      </div>

      <h2 className="text-base font-semibold mt-8 mb-4">{t.event.articles}</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {detail.articles.map((article) => (
          <div
            key={article.article_id}
            className="relative flex flex-col gap-2 overflow-hidden rounded-[3px] border border-rule bg-surface p-4 shadow-1"
          >
            <ShineBorder
              borderWidth={1}
              duration={13 + (article.article_id.charCodeAt(0) % 5)}
              shineColor={["#c48820", "#E8A838", "#f5c563"]}
            />
            <ArticleImage
              src={article.image_url}
              alt={article.title}
              className="h-40 w-full rounded-md object-cover"
            />
            <div className="flex items-center justify-between gap-2">
              <SourceBadge name={article.source_name} showName />
              <BiasLabel
                label={article.bias_label}
                confidence={article.bias_confidence}
              />
            </div>
            <h3 className="font-serif text-base font-semibold leading-snug text-balance">
              {article.title}
            </h3>
            <p className="text-sm text-ink-dim leading-relaxed line-clamp-4">
              {article.body.slice(0, 200)}
              {article.body.length > 200 && "…"}
            </p>
            <div className="flex items-center justify-between mt-auto pt-2 text-sm text-ink-faint">
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
