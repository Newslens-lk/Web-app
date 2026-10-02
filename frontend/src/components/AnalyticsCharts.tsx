"use client";

import { useCallback, useEffect, useRef } from "react";
import type { Chart } from "chart.js";
import type { AnalyticsOverview, AnalyticsBucket } from "@/lib/analytics";
import { sourceDisplayName } from "@/lib/constants";
import { useI18n } from "@/lib/i18n/client";

export function AnalyticsCharts({ data }: { data: AnalyticsOverview }) {
  const { t } = useI18n();
  const labelText = useCallback(
    (label: AnalyticsBucket["label"]) => label === "unclassified" ? "Unclassified" : t.bias[label],
    [t],
  );
  const overallCanvas = useRef<HTMLCanvasElement>(null);
  const publisherCanvas = useRef<HTMLCanvasElement>(null);
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
        const color = (label: AnalyticsBucket["label"]) => css.getPropertyValue(
          label === "unclassified" ? "--ink-faint" : `--bias-${label.replaceAll("_", "-")}`,
        ).trim();
        if (!overallCanvas.current || !publisherCanvas.current) return;
        charts = [new ChartJS(overallCanvas.current, {
          type: "bar",
          data: {
            labels: data.bias_distribution.map((b) => labelText(b.label)),
            datasets: [{ label: "Articles", data: data.bias_distribution.map((b) => b.count), backgroundColor: data.bias_distribution.map((b) => color(b.label)) }],
          },
          options: {
            responsive: true, maintainAspectRatio: false, animation: false, indexAxis: "y",
            plugins: { legend: { display: false }, tooltip: { callbacks: { label: (context) => {
              const b = data.bias_distribution[context.dataIndex];
              return `${b.count} articles (${b.percentage}%)`;
            } } } },
            scales: { x: { beginAtZero: true, ticks: { color: ink, precision: 0 }, grid: { color: grid } }, y: { ticks: { color: ink }, grid: { display: false } } },
          },
        }), new ChartJS(publisherCanvas.current, {
          type: "bar",
          data: {
            labels: data.publishers.map((p) => sourceDisplayName(p.source_name)),
            datasets: data.bias_distribution.map((b, index) => ({
              label: labelText(b.label), backgroundColor: color(b.label),
              data: data.publishers.map((p) => p.bias_distribution[index].count * 100 / p.article_count),
            })),
          },
          options: {
            responsive: true, maintainAspectRatio: false, animation: false, indexAxis: "y",
            plugins: { legend: { display: false }, tooltip: { callbacks: { label: (context) => {
              const b = data.publishers[context.dataIndex].bias_distribution[context.datasetIndex];
              return `${labelText(b.label)}: ${b.count} articles (${b.percentage}%)`;
            } } } },
            scales: { x: { stacked: true, min: 0, max: 100, ticks: { color: ink, callback: (v) => `${v}%` }, grid: { color: grid } }, y: { stacked: true, ticks: { color: ink }, grid: { display: false } } },
          },
        })];
      };
      draw();
      observer = new MutationObserver(draw);
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
      media.addEventListener("change", draw);
    });
    return () => { disposed = true; observer?.disconnect(); media.removeEventListener("change", draw); charts.forEach((chart) => chart.destroy()); };
  }, [data, labelText]);

  return <div className="space-y-12">
    <section>
      <h2 className="font-serif text-xl font-semibold">What are the selected articles predicted as?</h2>
      <div className="mt-4 h-72"><canvas ref={overallCanvas} role="img" aria-label="Article counts by predicted bias. Exact values are in the following table." /></div>
      <table className="[&_td]:px-2 [&_th]:px-2 mt-4 w-full text-sm">
        <caption className="sr-only">Overall predicted bias distribution</caption>
        <thead><tr className="text-left"><th scope="col" className="py-2">Category</th><th scope="col">Articles</th><th scope="col">Share</th></tr></thead>
        <tbody>{data.bias_distribution.map((b) => <tr key={b.label} className="odd:bg-surface-2"><th scope="row" className="py-2 text-left font-normal">{labelText(b.label)}</th><td>{b.count}</td><td>{b.percentage.toFixed(1)}%</td></tr>)}</tbody>
      </table>
    </section>
    <section>
      <h2 className="font-serif text-xl font-semibold">How do publishers&rsquo; article mixes differ?</h2>
      <div className="mt-4 flex flex-wrap gap-4 text-xs">{data.bias_distribution.map((b) => <span key={b.label} className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-sm" style={{ backgroundColor: b.label === "unclassified" ? "var(--ink-faint)" : `var(--bias-${b.label.replaceAll("_", "-")})` }} />{labelText(b.label)}</span>)}</div>
      <div className="mt-4" style={{ height: Math.max(220, data.publishers.length * 65) }}><canvas ref={publisherCanvas} role="img" aria-label="Predicted bias shares by publisher. Exact counts and percentages follow." /></div>
      <div className="mt-4 overflow-x-auto">
        <table className="[&_td]:px-2 [&_th]:px-2 w-full text-sm">
          <caption className="sr-only">Publisher sample sizes and predicted bias shares</caption>
          <thead><tr className="text-left"><th scope="col" className="py-3 pr-4">Publisher</th><th scope="col" className="pr-4">Articles</th>{data.bias_distribution.map((b) => <th scope="col" key={b.label} className="px-3 whitespace-nowrap">{labelText(b.label)}</th>)}</tr></thead>
          <tbody>{data.publishers.map((p) => <tr key={p.source_name} className="odd:bg-surface-2">
            <th scope="row" className="py-3 pr-4 text-left font-normal whitespace-nowrap">{sourceDisplayName(p.source_name)}{p.article_count < 20 && <span className="block text-xs text-ink-faint">Few articles so far</span>}</th>
            <td className="pr-4 font-mono">{p.article_count}</td>{p.bias_distribution.map((b) => <td key={b.label} className="px-3 whitespace-nowrap">{b.count} <span className="text-ink-dim">({b.percentage.toFixed(1)}%)</span></td>)}
          </tr>)}</tbody>
        </table>
      </div>
    </section>
  </div>;
}
