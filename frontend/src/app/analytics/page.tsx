import Link from "next/link";
import { getSources } from "@/lib/api";
import { getAnalytics, getInsights } from "@/lib/analytics";
import { BIAS_LABELS, sourceDisplayName } from "@/lib/constants";
import { getDictionary } from "@/lib/i18n/server";
import { AnalyticsCharts } from "@/components/AnalyticsCharts";
import { AnalyticsInsights } from "@/components/AnalyticsInsights";
import { AnalyticsTabs } from "@/components/AnalyticsTabs";

type Props = { searchParams: Record<string, string | string[] | undefined> };

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
  const [result, insights] = await Promise.all([getAnalytics(query), getInsights(query)]);
  let sourceOptions: string[] = [];
  try { sourceOptions = (await getSources()).sources.map((s) => s.source_name); } catch { /* Filters remain usable on API failure. */ }
  sourceOptions = Array.from(new Set([...sourceOptions, ...query.getAll("source")]));
  const data = result.data;
  const bareClass = "cursor-pointer bg-transparent py-1 font-semibold text-ink hover:text-brand";

  const stats: { label: string; value: string }[] = [];
  if (data) {
    const filtered = Boolean(data.date_from || data.date_to);
    const undated = filtered ? data.undated_excluded : data.missing_publication_dates;
    stats.push(
      { label: "Articles", value: data.total_articles.toLocaleString("en-US") },
      { label: "Publishers", value: data.total_sources.toLocaleString("en-US") },
      { label: "Events", value: data.total_events.toLocaleString("en-US") },
    );
    if (undated > 0) stats.push({ label: filtered ? "Left out, no date" : "No publication date", value: undated.toLocaleString("en-US") });
    if (filtered) stats.push({ label: "Period", value: data.date_from && data.date_to ? `${shortDate(data.date_from)} – ${shortDate(data.date_to)}` : data.date_from ? `Since ${shortDate(data.date_from)}` : `Up to ${shortDate(data.date_to!)}` });
    if (data.bias_label) stats.push({ label: "Predicted bias", value: t.bias[data.bias_label] });
  }

  return <div className="space-y-4">
    <header className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2">
      <h1 className="font-serif text-2xl font-semibold">How publishers lean</h1>
      {data && <dl className="flex flex-wrap gap-x-6 gap-y-1">
        {stats.map((stat) => <div key={stat.label} className="flex items-baseline gap-1.5">
          <dd className="font-serif text-xl font-semibold">{stat.value}</dd>
          <dt className="text-sm text-ink-dim">{stat.label}</dt>
        </div>)}
      </dl>}
    </header>

    <form key={query.toString()} action="/analytics" method="get" className="py-2 text-sm">
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
        {sourceOptions.length > 0 && <details className="relative">
          <summary className={`${bareClass} list-none`}>Publishers{query.getAll("source").length > 0 ? ` (${query.getAll("source").length})` : ""} <span aria-hidden>▾</span></summary>
          <div className="absolute left-0 z-20 mt-1 flex min-w-48 flex-col gap-2 border border-rule bg-surface p-3">
            {sourceOptions.map((name) => <label key={name} className="inline-flex cursor-pointer items-center gap-2">
              <input type="checkbox" name="source" value={name} defaultChecked={query.getAll("source").includes(name)} />{sourceDisplayName(name)}
            </label>)}
          </div>
        </details>}
        <span className="flex items-center gap-4">
          <button className="rounded-[3px] bg-brand px-3 py-1.5 font-semibold text-white hover:opacity-90" type="submit">Update</button>
          <Link href="/analytics" className="text-ink-dim underline underline-offset-2 hover:text-ink">Reset</Link>
        </span>
      </div>
    </form>
    {result.error && <p role="alert" className="border-l-2 border-amber pl-4 text-sm">{result.error}</p>}
    {data && (data.total_articles === 0
      ? <p className="py-12 text-center text-ink-dim">Nothing matches these filters. Try a wider date range, or <Link href="/analytics" className="underline underline-offset-2">reset them</Link>.</p>
      : <>
        {(() => {
          const unavailable = <p role="alert" className="border-l-2 border-amber pl-4 text-sm">This view is unavailable right now.</p>;
          const detail = (part: "timeline" | "quality") => insights.data ? <AnalyticsInsights data={insights.data} part={part} /> : unavailable;
          return <AnalyticsTabs tabs={[
            { id: "mix", label: "Bias mix", content: <AnalyticsCharts data={data} /> },
            { id: "timeline", label: "Timeline", content: detail("timeline") },
            { id: "quality", label: "Data quality", content: detail("quality") },
          ]} />;
        })()}
      </>)}

  </div>;
}
