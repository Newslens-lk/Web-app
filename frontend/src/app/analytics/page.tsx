import Link from "next/link";
<<<<<<< HEAD
import { getStats } from "@/lib/api";
import { BIAS_COLORS, SOURCE_DISPLAY } from "@/lib/constants";
import { getDictionary } from "@/lib/i18n/server";
import { ShineBorder } from "@/components/ShineBorder";
import type { BiasLabel } from "@/lib/types";

export default async function AnalyticsPage() {
  const t = getDictionary();
  const stats = await getStats();

  const biasEntries = Object.entries(stats.bias_breakdown).sort(
    ([a], [b]) => {
      const order = ["far_left", "left", "center", "right", "far_right"];
      return order.indexOf(a) - order.indexOf(b);
    },
  );
  const maxBias = Math.max(...biasEntries.map(([, v]) => v), 1);

  const sourceEntries = Object.entries(stats.articles_per_source).sort(
    ([, a], [, b]) => b - a,
  );
  const maxSource = Math.max(...sourceEntries.map(([, v]) => v), 1);

  return (
    <div className="rise-in">
      <h1 className="font-serif text-lg font-semibold mb-6">{t.analytics.title}</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {[
          { label: t.analytics.totalArticles, value: stats.total_articles },
          { label: t.analytics.totalEvents, value: stats.total_events },
          { label: t.analytics.articlesToday, value: stats.articles_today },
          { label: t.analytics.eventsToday, value: stats.events_today },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-surface border border-rule rounded-[3px] p-4 text-center shadow-1"
          >
            <div className="font-mono text-xl font-semibold tabular-nums">
              {s.value}
            </div>
            <div className="text-sm text-ink-dim mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="relative overflow-hidden rounded-[3px] border border-rule bg-surface p-5 shadow-1">
          <ShineBorder borderWidth={1} duration={13} shineColor={["#5b2545", "#d9b65c", "#d9a3c4"]} />
          <h2 className="text-base font-semibold mb-4">{t.analytics.biasDistribution}</h2>
          <div className="flex flex-col gap-2.5">
            {biasEntries.map(([label, count]) => (
              <Link
                key={label}
                href={`/articles?bias_label=${encodeURIComponent(label)}`}
                className="flex items-center gap-2 rounded px-1 text-sm hover:bg-surface-2"
              >
                <span className="w-20 text-right text-ink-dim">
                  {t.bias[label as BiasLabel] ?? label}
                </span>
                <div className="flex-1 h-6 bg-surface-2 rounded overflow-hidden">
                  <div
                    className="h-full rounded"
                    style={{
                      width: `${(count / maxBias) * 100}%`,
                      backgroundColor:
                        BIAS_COLORS[label as BiasLabel] ?? "#6B7280",
                    }}
                  />
                </div>
                <span className="font-mono text-sm w-12 text-right tabular-nums">
                  {count}
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[3px] border border-rule bg-surface p-5 shadow-1">
          <ShineBorder borderWidth={1} duration={16} shineColor={["#5b2545", "#d9b65c", "#d9a3c4"]} />
          <h2 className="text-base font-semibold mb-4">{t.analytics.articlesPerSource}</h2>
          <div className="flex flex-col gap-2.5">
            {sourceEntries.map(([source, count]) => (
              <div key={source} className="flex items-center gap-2 text-sm">
                <span className="w-24 text-right text-ink-dim truncate">
                  {SOURCE_DISPLAY[source] ?? source}
                </span>
                <div className="flex-1 h-6 bg-surface-2 rounded overflow-hidden">
                  <div
                    className="h-full rounded bg-brand"
                    style={{ width: `${(count / maxSource) * 100}%` }}
                  />
                </div>
                <span className="font-mono text-sm w-12 text-right tabular-nums">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {stats.last_pipeline_run && (
        <p className="text-sm text-ink-faint mt-6">
          {t.analytics.lastRun} {new Date(stats.last_pipeline_run).toLocaleString()}
        </p>
      )}
    </div>
  );
=======
import { getSources } from "@/lib/api";
import { getAnalytics } from "@/lib/analytics";
import { BIAS_DISPLAY, BIAS_LABELS, sourceDisplayName } from "@/lib/constants";
import { AnalyticsCharts } from "@/components/AnalyticsCharts";

type Props = { searchParams: Record<string, string | string[] | undefined> };

export default async function AnalyticsPage({ searchParams }: Props) {
  const query = new URLSearchParams();
  for (const key of ["source", "date_from", "date_to", "bias_label"]) {
    const value = searchParams[key];
    for (const item of Array.isArray(value) ? value : value ? [value] : []) {
      if (item) query.append(key, item);
    }
  }
  const result = await getAnalytics(query);
  let sourceOptions: string[] = [];
  try { sourceOptions = (await getSources()).sources.map((s) => s.source_name); } catch { /* Filters remain usable on API failure. */ }
  sourceOptions = Array.from(new Set([...sourceOptions, ...query.getAll("source")]));
  const data = result.data;
  const inputClass = "mt-2 block w-full rounded-md border border-rule-strong bg-surface px-3 py-2 text-sm";
  return <div className="space-y-6">
    <header>
      <p className="text-xs font-semibold uppercase tracking-widest text-amber">News insights</p>
      <h1 className="mt-2 font-serif text-3xl font-semibold">How publishers cover the news</h1>
      <p className="mt-2 text-sm text-ink-dim">Compare article predictions across publishers. These are model-generated estimates and may be wrong, not permanent ratings of news organisations.</p>
    </header>
    <form key={query.toString()} action="/analytics" method="get" className="rounded-lg border border-rule bg-surface p-5 space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="text-sm font-semibold">Published from<input className={inputClass} name="date_from" type="date" defaultValue={query.get("date_from") ?? ""} /></label>
        <label className="text-sm font-semibold">Published through<input className={inputClass} name="date_to" type="date" defaultValue={query.get("date_to") ?? ""} /></label>
        <label className="text-sm font-semibold">Predicted bias<select name="bias_label" className={inputClass} defaultValue={query.get("bias_label") ?? ""}>
          <option value="">All categories</option>
          {BIAS_LABELS.map((label) => <option key={label} value={label}>{BIAS_DISPLAY[label]}</option>)}
        </select></label>
      </div>
      <fieldset>
        <legend className="text-sm font-semibold mb-2">Publishers <span className="font-normal text-ink-dim">— leave unchecked for all</span></legend>
        <div className="flex flex-wrap gap-x-5 gap-y-3">
          {sourceOptions.map((name) => <label key={name} className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" name="source" value={name} defaultChecked={query.getAll("source").includes(name)} />{sourceDisplayName(name)}
          </label>)}
        </div>
      </fieldset>
      <div className="flex items-center gap-4">
        <button className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white" type="submit">Apply filters</button>
        <Link href="/analytics" className="text-sm text-brand hover:underline">Reset</Link>
      </div>
      <p className="text-xs text-ink-dim">Dates use Sri Lanka time (Asia/Colombo). Both boundary dates are included. Topic and sentiment analysis will be available when those data are collected.</p>
    </form>
    {result.error && <p role="alert" className="rounded-lg border border-amber bg-amber-tint p-4 text-sm">{result.error}</p>}
    {data && <>
      <p className="text-sm text-ink-dim">Analysis period: {data.date_from ?? "Earliest available"} to {data.date_to ?? "Latest available"} · {data.timezone} · {data.bias_label ? BIAS_DISPLAY[data.bias_label] : "All bias categories"}</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Matching articles", data.total_articles], ["Distinct events", data.total_events],
          ["Represented publishers", data.total_sources],
          [data.date_from || data.date_to ? "Undated articles excluded" : "Articles missing dates", data.undated_excluded || data.missing_publication_dates],
        ].map(([label, value]) => <div key={label} className="rounded-lg border border-rule bg-surface p-5">
          <p className="font-mono text-3xl font-semibold">{Number(value).toLocaleString("en-US")}</p><p className="mt-2 text-sm text-ink-dim">{label}</p>
        </div>)}
      </div>
      <p className="text-xs text-ink-dim">{data.date_from || data.date_to
        ? "Undated articles matching the publisher and bias filters are excluded from this period. Collection dates are never substituted for publication dates."
        : "All-time results include articles without a publication date."} Events are counted once even when several publishers cover them.</p>
      {data.total_articles === 0
        ? <p className="rounded-lg border border-rule bg-surface p-10 text-center text-ink-dim">No articles match these filters. Try a wider date range or reset the filters.</p>
        : <AnalyticsCharts data={data} />}
    </>}
  </div>;
>>>>>>> origin/master
}
