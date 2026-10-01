import Link from "next/link";
import { getSources } from "@/lib/api";
import { getAnalytics } from "@/lib/analytics";
import { BIAS_LABELS, sourceDisplayName } from "@/lib/constants";
import { getDictionary } from "@/lib/i18n/server";
import { AnalyticsCharts } from "@/components/AnalyticsCharts";

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
  const result = await getAnalytics(query);
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
      : <AnalyticsCharts data={data} />)}

    <p className="border-t border-rule pt-4 text-xs leading-relaxed text-ink-dim">
      Bias labels come from a model, so treat them as estimates rather than verdicts on a publisher, and they say nothing about factual accuracy.
      Publishers cover different stories, so their shares aren&rsquo;t a like-for-like comparison. An event covered by several publishers is counted once.
      Dates are in Sri Lanka time and include both ends of the range.
    </p>
  </div>;
}
