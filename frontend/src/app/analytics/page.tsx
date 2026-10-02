import Link from "next/link";
import { getSources } from "@/lib/api";
import { getAnalytics, getInsights, getStories } from "@/lib/analytics";
import { BIAS_LABELS, sourceDisplayName } from "@/lib/constants";
import { getDictionary } from "@/lib/i18n/server";
import { AnalyticsCharts } from "@/components/AnalyticsCharts";
import { AnalyticsInsights } from "@/components/AnalyticsInsights";
import { AnalyticsSpectrum } from "@/components/AnalyticsSpectrum";
import { AnalyticsTabs } from "@/components/AnalyticsTabs";

type Props = { searchParams: Record<string, string | string[] | undefined> };

const plural = (n: number, word: string) => `${n.toLocaleString("en-US")} ${word}${n === 1 ? "" : "s"}`;
const shortDate = (value: string) =>
  new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

export default async function AnalyticsPage({ searchParams }: Props) {
  const t = getDictionary();
  const query = new URLSearchParams();
  for (const key of ["source", "date_from", "date_to", "bias_label"]) {
    const value = searchParams[key];
    for (const item of Array.isArray(value) ? value : value ? [value] : []) {
      if (item) query.append(key, item);
    }
  }
  const [result, insights, stories] = await Promise.all([getAnalytics(query), getInsights(query), getStories(query)]);
  let sourceOptions: string[] = [];
  try { sourceOptions = (await getSources()).sources.map((s) => s.source_name); } catch { /* Filters remain usable on API failure. */ }
  sourceOptions = Array.from(new Set([...sourceOptions, ...query.getAll("source")]));
  const data = result.data;
  const bareClass = "cursor-pointer bg-transparent py-1 font-semibold text-ink hover:text-brand";

  let summary = "";
  let undatedNote = "";
  if (data) {
    const period = data.date_from && data.date_to ? ` between ${shortDate(data.date_from)} and ${shortDate(data.date_to)}`
      : data.date_from ? ` since ${shortDate(data.date_from)}`
        : data.date_to ? ` up to ${shortDate(data.date_to)}` : "";
    const lean = data.bias_label ? `, all labelled ${t.bias[data.bias_label]}` : "";
    summary = `${plural(data.total_articles, "article")} from ${plural(data.total_sources, "publisher")}, covering ${plural(data.total_events, "event")}${period}${lean}.`;
    const filtered = Boolean(data.date_from || data.date_to);
    const undated = filtered ? data.undated_excluded : data.missing_publication_dates;
    if (undated > 0) {
      undatedNote = filtered
        ? `${plural(undated, "article")} with no publication date ${undated === 1 ? "is" : "are"} left out.`
        : `Includes ${plural(undated, "article")} with no publication date.`;
    }
  }

  return <div className="space-y-8">
    <header>
      <h1 className="font-serif text-3xl font-semibold">How publishers lean</h1>
      {data && <p className="mt-2 text-base text-ink-dim">{summary} {undatedNote}</p>}
    </header>

    <form key={query.toString()} action="/analytics" method="get" className="space-y-3 border-y border-rule py-3 text-sm">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <span className="flex items-center gap-1.5 text-ink-dim">
          <input className={bareClass} name="date_from" type="date" aria-label="Published from" defaultValue={query.get("date_from") ?? ""} />
          <span aria-hidden>–</span>
          <input className={bareClass} name="date_to" type="date" aria-label="Published through" defaultValue={query.get("date_to") ?? ""} />
        </span>
        <select name="bias_label" aria-label="Predicted bias" className={bareClass} defaultValue={query.get("bias_label") ?? ""}>
          <option value="">Any bias</option>
          {BIAS_LABELS.map((label) => <option key={label} value={label}>{t.bias[label]}</option>)}
        </select>
        <span className="flex items-center gap-4">
          <button className="rounded-[3px] bg-brand px-3 py-1.5 font-semibold text-white hover:opacity-90" type="submit">Update</button>
          <Link href="/analytics" className="text-ink-dim underline underline-offset-2 hover:text-ink">Reset</Link>
        </span>
      </div>
      {sourceOptions.length > 0 && <fieldset className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <legend className="float-left mr-1 text-ink-dim">Publishers:</legend>
        {sourceOptions.map((name) => <label key={name} className="inline-flex cursor-pointer items-center gap-2">
          <input type="checkbox" name="source" value={name} defaultChecked={query.getAll("source").includes(name)} />{sourceDisplayName(name)}
        </label>)}
      </fieldset>}
    </form>
    {result.error && <p role="alert" className="border-l-2 border-amber pl-4 text-sm">{result.error}</p>}
    {data && (data.total_articles === 0
      ? <p className="py-12 text-center text-ink-dim">Nothing matches these filters. Try a wider date range, or <Link href="/analytics" className="underline underline-offset-2">reset them</Link>.</p>
      : <>
        {(() => {
          const leading = [...data.bias_distribution].sort((a, b) => b.count - a.count)[0];
          const publisher = data.publishers[0];
          return <section className="border-l-2 border-brand bg-brand/5 p-4" aria-label="Quick read">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand">Quick read</p>
            <p className="mt-2 text-sm leading-6 text-ink"><span className="font-semibold">{leading.label === "unclassified" ? "Unclassified" : t.bias[leading.label]}</span> is the largest predicted category ({leading.count.toLocaleString("en-US")} articles, {leading.percentage.toFixed(1)}%). {publisher && <><span className="font-semibold">{sourceDisplayName(publisher.source_name)}</span> has the largest matching sample ({publisher.article_count.toLocaleString("en-US")} articles).</>}</p>
          </section>;
        })()}
        {(() => {
          const unavailable = <p role="alert" className="border-l-2 border-amber pl-4 text-sm">This view is unavailable right now.</p>;
          const detail = (part: "confidence" | "timeline" | "quality") => insights.data ? <AnalyticsInsights data={insights.data} part={part} /> : unavailable;
          return <AnalyticsTabs tabs={[
            { id: "spectrum", label: "Spectrum", content: <AnalyticsSpectrum overview={data} stories={stories.data} part="spectrum" /> },
            { id: "stories", label: "Shared stories", content: <AnalyticsSpectrum overview={data} stories={stories.data} part="shared" /> },
            { id: "mix", label: "Bias mix", content: <AnalyticsCharts data={data} /> },
            { id: "confidence", label: "Confidence", content: detail("confidence") },
            { id: "timeline", label: "Timeline", content: detail("timeline") },
            { id: "quality", label: "Data quality", content: detail("quality") },
          ]} />;
        })()}
      </>)}

    <p className="border-t border-rule pt-4 text-xs text-ink-dim">Bias labels are model estimates, not verdicts on a publisher or on accuracy.</p>
  </div>;
}
