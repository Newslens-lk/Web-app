import Link from "next/link";
import { notFound } from "next/navigation";
import { getEventDetail, relativeTime } from "@/lib/api";
import { BiasBar } from "@/components/BiasBar";
import { BiasLabel } from "@/components/BiasLabel";
import { SourceBadge } from "@/components/SourceBadge";
import { BIAS_LABELS, BIAS_DISPLAY, BIAS_COLORS } from "@/lib/constants";

type Props = { params: { eventId: string } };

export default async function EventDetailPage({ params }: Props) {
  let detail;
  try {
    detail = await getEventDetail(params.eventId);
  } catch {
    notFound();
  }

  const headline = detail.summary ?? detail.articles[0]?.title ?? "Untitled event";

  return (
    <div className="max-w-[900px] py-4">
      <Link
        href="/"
        className="inline-block text-[13.5px] font-semibold text-brand hover:underline mb-4"
      >
        &larr; Back to Events
      </Link>

      <h1 className="font-serif text-[28px] font-semibold leading-[1.2] text-balance">
        {headline}
      </h1>
      <p className="text-[13px] text-ink-faint mt-2">
        {detail.article_count} article{detail.article_count !== 1 && "s"} from{" "}
        {detail.source_count} source{detail.source_count !== 1 && "s"} ·{" "}
        {detail.window_start
          ? new Date(detail.window_start).toLocaleDateString("en-LK", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : ""}
      </p>

      <div className="mt-6">
        <h2 className="text-[13px] font-semibold text-ink-dim mb-2">Bias Distribution</h2>
        <BiasBar distribution={detail.bias_distribution} size="lg" />
        <div className="flex flex-wrap gap-3 mt-2 text-[12px]">
          {BIAS_LABELS.map((label) => (
            <span key={label} className="flex items-center gap-1">
              <span
                className="inline-block w-2.5 h-2.5 rounded-sm"
                style={{ backgroundColor: BIAS_COLORS[label] }}
              />
              {BIAS_DISPLAY[label]} ({detail.bias_distribution[label] ?? 0})
            </span>
          ))}
        </div>
      </div>

      <h2 className="text-[15px] font-semibold mt-8 mb-4">Articles</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {detail.articles.map((article) => (
          <div
            key={article.article_id}
            className="bg-surface border border-rule rounded-[10px] p-4 flex flex-col gap-2"
          >
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
                {article.published_at ? relativeTime(article.published_at) : "date unknown"}
              </span>
              <div className="flex gap-2">
                <Link
                  href={`/articles/${article.article_id}`}
                  className="text-brand font-semibold hover:underline"
                >
                  Details
                </Link>
                <a
                  href={article.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand font-semibold hover:underline"
                >
                  Read Original &nearr;
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
