"use client";

import { useCallback, useEffect, useRef } from "react";
import type { Chart } from "chart.js";
import type { AnalyticsBucket, AnalyticsInsights as Insights } from "@/lib/analytics";
import { sourceDisplayName } from "@/lib/constants";
import { useI18n } from "@/lib/i18n/client";

type Label = AnalyticsBucket["label"];

const weekText = (value: string) =>
  new Date(`${value}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
const dayText = (value: string | null) =>
  value ? new Date(`${value}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "none";
const pct = (n: number, total: number) => (total ? `${((n * 100) / total).toFixed(1)}%` : "n/a");

export function AnalyticsInsights({ data, part }: { data: Insights; part: "timeline" | "quality" }) {
  const { t } = useI18n();
  const labelText = useCallback((label: Label) => label === "unclassified" ? "Unclassified" : t.bias[label], [t]);
  const volumeCanvas = useRef<HTMLCanvasElement>(null);
  const shareCanvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let disposed = false;
    let charts: Chart[] = [];
    let observer: MutationObserver | undefined;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    let draw = () => {};
    import("chart.js/auto").then(({ default: ChartJS }) => {
      if (disposed) return;
      draw = () => {
        charts.forEach((chart) => chart.destroy());
        const css = getComputedStyle(document.documentElement);
        const ink = css.getPropertyValue("--ink-dim").trim();
        const grid = css.getPropertyValue("--rule").trim();
        const brand = css.getPropertyValue("--ink-faint").trim();
        const color = (label: Label) => css.getPropertyValue(
          label === "unclassified" ? "--ink-faint" : `--bias-${label.replaceAll("_", "-")}`,
        ).trim();
        const weeks = data.timeline.map((w) => weekText(w.week_start));
        const labels = data.categories.map((c) => c.label);
        const axis = { ticks: { color: ink, maxRotation: 0, autoSkip: true }, grid: { display: false } };

        charts = [
          volumeCanvas.current && new ChartJS(volumeCanvas.current, {
            type: "bar",
            data: { labels: weeks, datasets: [{ label: "Articles", data: data.timeline.map((w) => w.total), backgroundColor: brand }] },
            options: {
              responsive: true, maintainAspectRatio: false, animation: false,
              plugins: { legend: { display: false }, tooltip: { callbacks: { title: (items) => `Week of ${weeks[items[0].dataIndex]}` } } },
              scales: { x: axis, y: { beginAtZero: true, ticks: { color: ink, precision: 0 }, grid: { color: grid } } },
            },
          }),
          shareCanvas.current && new ChartJS(shareCanvas.current, {
            type: "line",
            data: {
              labels: weeks,
              datasets: labels.map((label) => ({
                label: labelText(label), borderColor: color(label), backgroundColor: color(label),
                fill: true, borderWidth: 0.5, pointRadius: 0, tension: 0, spanGaps: false,
                data: data.timeline.map((w) => w.total ? w.counts[label] * 100 / w.total : null),
              })),
            },
            options: {
              responsive: true, maintainAspectRatio: false, animation: false, interaction: { mode: "index", intersect: false },
              plugins: { legend: { display: false }, tooltip: { callbacks: {
                title: (items) => `Week of ${weeks[items[0].dataIndex]}`,
                label: (context) => {
                  const w = data.timeline[context.dataIndex];
                  const n = w.counts[labels[context.datasetIndex]];
                  return `${labelText(labels[context.datasetIndex])}: ${n} of ${w.total} (${(n * 100 / w.total).toFixed(1)}%)`;
                },
              } } },
              scales: { x: axis, y: { stacked: true, min: 0, max: 100, ticks: { color: ink, callback: (v) => `${v}%` }, grid: { color: grid } } },
            },
          }),
        ].filter(Boolean) as Chart[];
      };
      draw();
      observer = new MutationObserver(draw);
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
      media.addEventListener("change", draw);
    });
    return () => { disposed = true; observer?.disconnect(); media.removeEventListener("change", draw); charts.forEach((chart) => chart.destroy()); };
  }, [data, labelText, part]);

  const legend = data.categories.map((c) => <span key={c.label} className="inline-flex items-center gap-2">
    <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: c.label === "unclassified" ? "var(--ink-faint)" : `var(--bias-${c.label.replaceAll("_", "-")})` }} />{labelText(c.label)}
  </span>);
  const unclassified = data.categories.find((c) => c.label === "unclassified")?.count ?? 0;
  const datedTotal = data.publishers.reduce((sum, p) => sum + p.dated_articles, 0);

  return <div className="space-y-12">
    {part === "timeline" && <section>
      <h2 className="font-serif text-xl font-semibold">What did we collect, week by week?</h2>
      {data.timeline.length === 0
        ? <p className="mt-2 text-sm text-ink-dim">No dated articles match these filters.</p>
        : <>
          <p className="mt-4 text-sm font-semibold text-ink">Articles per week</p>
          <div className="mt-2 h-40"><canvas ref={volumeCanvas} role="img" aria-label="Articles published per week. Exact values are in the details table." /></div>
          <p className="mt-6 text-sm font-semibold text-ink">Category mix per week</p>
          <div className="mt-2 flex flex-wrap gap-4 text-xs">{legend}</div>
          <div className="mt-3 h-64"><canvas ref={shareCanvas} role="img" aria-label="Predicted category shares per week. Exact values are in the details table." /></div>
          <details className="mt-4 text-sm">
            <summary className="cursor-pointer text-ink-dim underline underline-offset-2">Show weekly values</summary>
            <div className="mt-3 overflow-x-auto">
              <table className="[&_td]:px-2 [&_th]:px-2 w-full">
                <caption className="sr-only">Predicted categories by week</caption>
                <thead><tr className="text-left"><th scope="col" className="py-2 pr-4">Week of</th><th scope="col" className="pr-4">Articles</th>{data.categories.map((c) => <th scope="col" key={c.label} className="px-3 whitespace-nowrap">{labelText(c.label)}</th>)}</tr></thead>
                <tbody>{data.timeline.map((w) => <tr key={w.week_start} className="odd:bg-surface-2">
                  <th scope="row" className="py-2 pr-4 text-left font-normal whitespace-nowrap">{weekText(w.week_start)}</th><td className="pr-4 font-mono">{w.total}</td>
                  {data.categories.map((c) => <td key={c.label} className="px-3">{w.counts[c.label] ?? 0}</td>)}
                </tr>)}</tbody>
              </table>
            </div>
          </details>
        </>}
    </section>}

    {part === "quality" && <section>
      <h2 className="font-serif text-xl font-semibold">Can this data be trusted?</h2>
      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
        <div><dt className="text-ink-dim">Without a date</dt><dd className="font-mono text-lg">{data.total_articles - datedTotal}</dd><dd className="text-xs text-ink-dim">{pct(data.total_articles - datedTotal, data.total_articles)} of articles</dd></div>
        <div><dt className="text-ink-dim">Unclassified</dt><dd className="font-mono text-lg">{unclassified}</dd><dd className="text-xs text-ink-dim">{pct(unclassified, data.total_articles)} of articles</dd></div>
      </dl>
      <div className="mt-6 grid gap-8 md:grid-cols-[2fr_1fr]">
        <div className="overflow-x-auto">
          <table className="[&_td]:px-2 [&_th]:px-2 w-full text-sm">
            <caption className="mb-2 text-left text-sm font-semibold text-ink">Coverage by publisher</caption>
            <thead><tr className="text-left"><th scope="col" className="py-2 pr-4">Publisher</th><th scope="col" className="pr-4">Articles</th><th scope="col" className="pr-4">Dated</th><th scope="col" className="whitespace-nowrap pr-4">First</th><th scope="col" className="whitespace-nowrap">Latest</th></tr></thead>
            <tbody>{data.publishers.map((p) => <tr key={p.source_name} className="odd:bg-surface-2">
              <th scope="row" className="py-2 pr-4 text-left font-normal whitespace-nowrap">{sourceDisplayName(p.source_name)}</th>
              <td className="pr-4 font-mono">{p.article_count}</td><td className="pr-4 font-mono">{p.dated_articles}</td>
              <td className="whitespace-nowrap pr-4">{dayText(p.first_published)}</td><td className="whitespace-nowrap">{dayText(p.latest_published)}</td>
            </tr>)}</tbody>
          </table>
        </div>
        <table className="[&_td]:px-2 [&_th]:px-2 h-fit w-full text-sm">
          <caption className="mb-2 text-left text-sm font-semibold text-ink">Language</caption>
          <thead><tr className="text-left"><th scope="col" className="py-2">Language</th><th scope="col">Articles</th><th scope="col">Share</th></tr></thead>
          <tbody>{data.languages.map((l) => <tr key={l.language} className="odd:bg-surface-2">
            <th scope="row" className="py-2 text-left font-normal uppercase">{l.language}</th><td>{l.count}</td><td>{pct(l.count, data.total_articles)}</td>
          </tr>)}</tbody>
        </table>
      </div>
    </section>}
  </div>;
}
