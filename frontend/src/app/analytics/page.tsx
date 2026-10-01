import Link from "next/link";
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
}
