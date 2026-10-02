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
const binText = (index: number) => `${index * 10}–${index * 10 + 10}%`;

export function AnalyticsInsights({ data, part }: { data: Insights; part: "confidence" | "timeline" | "quality" }) {
  const { t } = useI18n();
  const labelText = useCallback((label: Label) => label === "unclassified" ? "Unclassified" : t.bias[label], [t]);
  const confidenceCanvas = useRef<HTMLCanvasElement>(null);
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
        const labels = data.confidence.map((c) => c.label);
        const scored = data.confidence.filter((c) => c.label !== "unclassified" && c.scored > 0);
        const axis = { ticks: { color: ink, maxRotation: 0, autoSkip: true }, grid: { display: false } };

        charts = [
          // Share of each label's own articles per confidence bin, so labels with few articles stay comparable.
          confidenceCanvas.current && new ChartJS(confidenceCanvas.current, {
            type: "line",
            data: {
              labels: Array.from({ length: 10 }, (_, i) => binText(i)),
              datasets: scored.map((c) => ({
                label: labelText(c.label), borderColor: color(c.label), backgroundColor: color(c.label),
                borderWidth: 2, pointRadius: 3, tension: 0,
                data: c.histogram.map((n) => n * 100 / c.scored),
              })),
            },
            options: {
              responsive: true, maintainAspectRatio: false, animation: false,
              plugins: { legend: { display: false }, tooltip: { callbacks: { label: (context) => {
                const c = scored[context.datasetIndex];
                const n = c.histogram[context.dataIndex];
                return `${labelText(c.label)}: ${n} of ${c.scored} articles (${(n * 100 / c.scored).toFixed(1)}%)`;
              } } } },
              scales: {
                x: { ...axis, title: { display: true, text: "Model confidence", color: ink } },
                y: { beginAtZero: true, ticks: { color: ink, callback: (v) => `${v}%` }, grid: { color: grid }, title: { display: true, text: "Share of that category's articles", color: ink } },
              },
            },
          }),
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

  const legend = data.confidence.map((c) => <span key={c.label} className="inline-flex items-center gap-2">
    <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: c.label === "unclassified" ? "var(--ink-faint)" : `var(--bias-${c.label.replaceAll("_", "-")})` }} />{labelText(c.label)}
  </span>);
  const scoredTotal = data.total_articles - data.missing_confidence;
  const unclassified = data.confidence.find((c) => c.label === "unclassified");
  const datedTotal = data.publishers.reduce((sum, p) => sum + p.dated_articles, 0);

  return <div className="space-y-12">
    {part === "confidence" && <section>
      <h2 className="font-serif text-xl font-semibold">How sure is the model?</h2>
      <div className="mt-4 flex flex-wrap gap-4 text-xs">{legend.slice(0, 5)}</div>
      <div className="mt-4 h-72"><canvas ref={confidenceCanvas} role="img" aria-label="Distribution of model confidence for each predicted category. Exact values are in the following table." /></div>
      <table className="[&_td]:px-2 [&_th]:px-2 mt-4 w-full text-sm">
        <caption className="sr-only">Model confidence by predicted category</caption>
        <thead><tr className="text-left"><th scope="col" className="py-2">Category</th><th scope="col">Articles scored</th><th scope="col">Average confidence</th><th scope="col">Below {Math.round(data.low_confidence_threshold * 100)}%</th></tr></thead>
        <tbody>{data.confidence.map((c) => <tr key={c.label} className="odd:bg-surface-2">
          <th scope="row" className="py-2 text-left font-normal">{labelText(c.label)}</th>
          <td>{c.scored}</td>
          <td>{c.mean === null ? "n/a" : `${(c.mean * 100).toFixed(1)}%`}</td>
          <td>{c.low_count} <span className="text-ink-dim">({pct(c.low_count, c.scored)})</span></td>
        </tr>)}</tbody>
      </table>
      {data.missing_confidence > 0 && <p className="mt-2 text-xs text-ink-dim">{data.missing_confidence} of {data.total_articles} articles have no confidence score and are left out here.</p>}
    </section>}

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
                <thead><tr className="text-left"><th scope="col" className="py-2 pr-4">Week of</th><th scope="col" className="pr-4">Articles</th>{data.confidence.map((c) => <th scope="col" key={c.label} className="px-3 whitespace-nowrap">{labelText(c.label)}</th>)}</tr></thead>
                <tbody>{data.timeline.map((w) => <tr key={w.week_start} className="odd:bg-surface-2">
                  <th scope="row" className="py-2 pr-4 text-left font-normal whitespace-nowrap">{weekText(w.week_start)}</th><td className="pr-4 font-mono">{w.total}</td>
                  {data.confidence.map((c) => <td key={c.label} className="px-3">{w.counts[c.label] ?? 0}</td>)}
                </tr>)}</tbody>
              </table>
            </div>
          </details>
        </>}
    </section>}

    {part === "quality" && <section>
      <h2 className="font-serif text-xl font-semibold">Can this data be trusted?</h2>
      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 text-sm sm:grid-cols-4">
        <div><dt className="text-ink-dim">Without a date</dt><dd className="font-mono text-lg">{data.total_articles - datedTotal}</dd><dd className="text-xs text-ink-dim">{pct(data.total_articles - datedTotal, data.total_articles)} of articles</dd></div>
        <div><dt className="text-ink-dim">Without a confidence score</dt><dd className="font-mono text-lg">{data.missing_confidence}</dd><dd className="text-xs text-ink-dim">{pct(data.missing_confidence, data.total_articles)} of articles</dd></div>
        <div><dt className="text-ink-dim">Unclassified</dt><dd className="font-mono text-lg">{unclassified?.total ?? 0}</dd><dd className="text-xs text-ink-dim">{pct(unclassified?.total ?? 0, data.total_articles)} of articles</dd></div>
        <div><dt className="text-ink-dim">Articles with a score</dt><dd className="font-mono text-lg">{scoredTotal}</dd><dd className="text-xs text-ink-dim">{pct(scoredTotal, data.total_articles)} of articles</dd></div>
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
