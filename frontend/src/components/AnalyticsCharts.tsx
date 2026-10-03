"use client";

import { useEffect, useRef, useCallback } from "react";
import type { Chart } from "chart.js";
import type { AnalyticsOverview } from "@/lib/analytics";
import { BIAS_LABELS } from "@/lib/constants";
import { sourceDisplayName } from "@/lib/constants";
import { useI18n } from "@/lib/i18n/client";

const BIAS_LABEL_DISPLAY: Record<string, string> = {
  far_left: "Far Left",
  left: "Left",
  center: "Center",
  right: "Right",
  far_right: "Far Right",
  unclassified: "Unclassified",
};

function biasColor(label: string): string {
  if (label === "unclassified") return "var(--ink-faint)";
  return `var(--bias-${label.replaceAll("_", "-")})`;
}

// ---------------------------------------------------------------------------
// Reporting Volume — horizontal bar chart, one bar per source
// ---------------------------------------------------------------------------

function VolumeChart({ data }: { data: AnalyticsOverview }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  const draw = useCallback(() => {
    if (!canvasRef.current) return;
    chartRef.current?.destroy();

    const css = getComputedStyle(document.documentElement);
    const ink = css.getPropertyValue("--ink-dim").trim();
    const grid = css.getPropertyValue("--rule").trim();
    const brand = css.getPropertyValue("--brand").trim();

    const sorted = [...data.publishers].sort(
      (a, b) => b.article_count - a.article_count,
    );

    import("chart.js/auto").then(({ default: ChartJS }) => {
      if (!canvasRef.current) return;
      chartRef.current = new ChartJS(canvasRef.current, {
        type: "bar",
        data: {
          labels: sorted.map((p) => sourceDisplayName(p.source_name)),
          datasets: [
            {
              label: "Articles",
              data: sorted.map((p) => p.article_count),
              backgroundColor: brand,
              borderRadius: 4,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: false,
          indexAxis: "y",
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => `${ctx.parsed.x} articles`,
              },
            },
          },
          scales: {
            x: {
              beginAtZero: true,
              ticks: { color: ink, precision: 0 },
              grid: { color: grid },
            },
            y: {
              ticks: { color: ink },
              grid: { display: false },
            },
          },
        },
      });
    });
  }, [data]);

  useEffect(() => {
    draw();

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const observer = new MutationObserver(draw);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    media.addEventListener("change", draw);

    return () => {
      observer.disconnect();
      media.removeEventListener("change", draw);
      chartRef.current?.destroy();
    };
  }, [draw]);

  const height = Math.max(200, data.publishers.length * 52);

  return (
    <div style={{ height }}>
      <canvas ref={canvasRef} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Bias Doughnut — one per publisher, article count in the center
// ---------------------------------------------------------------------------

function BiasDoughnut({
  publisher,
}: {
  publisher: AnalyticsOverview["publishers"][number];
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  const draw = useCallback(() => {
    if (!canvasRef.current) return;
    chartRef.current?.destroy();

    const css = getComputedStyle(document.documentElement);
    const ink = css.getPropertyValue("--ink").trim();

    const labels = publisher.bias_distribution.map(
      (b) => BIAS_LABEL_DISPLAY[b.label] ?? b.label,
    );
    const counts = publisher.bias_distribution.map((b) => b.count);
    const colors = publisher.bias_distribution.map((b) => biasColor(b.label));

    import("chart.js/auto").then(({ default: ChartJS }) => {
      if (!canvasRef.current) return;
      chartRef.current = new ChartJS(canvasRef.current, {
        type: "doughnut",
        data: {
          labels,
          datasets: [
            {
              data: counts,
              backgroundColor: colors,
              borderWidth: 0,
              hoverOffset: 4,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          animation: false,
          cutout: "62%",
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => {
                  const b = publisher.bias_distribution[ctx.dataIndex];
                  return ` ${BIAS_LABEL_DISPLAY[b.label]}: ${b.count} (${b.percentage.toFixed(1)}%)`;
                },
              },
            },
          },
        },
        plugins: [
          {
            id: "centerText",
            afterDraw(chart) {
              const { ctx, width, height } = chart;
              ctx.save();
              ctx.font = `600 ${Math.round(height / 6)}px sans-serif`;
              ctx.fillStyle = ink;
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillText(
                String(publisher.article_count),
                width / 2,
                height / 2,
              );
              ctx.restore();
            },
          },
        ],
      });
    });
  }, [publisher]);

  useEffect(() => {
    draw();

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const observer = new MutationObserver(draw);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    media.addEventListener("change", draw);

    return () => {
      observer.disconnect();
      media.removeEventListener("change", draw);
      chartRef.current?.destroy();
    };
  }, [draw]);

  return (
    <div className="flex flex-col items-center rounded-lg border border-rule bg-surface p-4">
      <p className="mb-3 text-sm font-semibold">
        {sourceDisplayName(publisher.source_name)}
      </p>
      <div className="mx-auto w-full max-w-[160px]">
        <canvas ref={canvasRef} />
      </div>
      <p className="mt-2 text-xs text-ink-dim">
        {publisher.article_count} articles
        {publisher.article_count < 20 && (
          <span className="ml-1 text-amber">· Small sample</span>
        )}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared bias legend
// ---------------------------------------------------------------------------

function BiasLegend() {
  const allLabels = [...BIAS_LABELS, "unclassified"] as const;
  return (
    <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs">
      {allLabels.map((label) => (
        <span key={label} className="inline-flex items-center gap-1.5">
          <span
            className="inline-block h-3 w-3 rounded-sm"
            style={{ backgroundColor: biasColor(label) }}
          />
          {BIAS_LABEL_DISPLAY[label]}
        </span>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main export — assembles the sections
// ---------------------------------------------------------------------------

export function AnalyticsCharts({ data }: { data: AnalyticsOverview }) {
  const { t } = useI18n();

  return (
    <div className="space-y-8">
      {/* Reporting Volume */}
      <section className="rounded-lg border border-rule bg-surface p-5">
        <h2 className="font-serif text-xl font-semibold">
          {t.analytics.reportingVolume}
        </h2>
        <p className="mt-1 text-sm text-ink-dim">
          {t.analytics.reportingVolumeDesc}
        </p>
        <div className="mt-4">
          <VolumeChart data={data} />
        </div>
      </section>

      {/* Bias by Publisher — doughnut grid */}
      <section>
        <h2 className="font-serif text-xl font-semibold">
          {t.analytics.biasByPublisher}
        </h2>
        <p className="mt-1 text-sm text-ink-dim">
          {t.analytics.biasByPublisherDesc}
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.publishers.map((pub) => (
            <BiasDoughnut key={pub.source_name} publisher={pub} />
          ))}
        </div>
      </section>

      {/* Shared legend */}
      <div className="pt-2">
        <BiasLegend />
      </div>
    </div>
  );
}
