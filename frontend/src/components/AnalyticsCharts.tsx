"use client";

import { useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import type { Chart } from "chart.js";
import type {
  AnalyticsOverview,
  TimelineResponse,
  TopEventsResponse,
} from "@/lib/analytics";
import { BIAS_LABELS } from "@/lib/constants";
import { sourceDisplayName } from "@/lib/constants";
import { useI18n } from "@/lib/i18n/client";

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const BIAS_LABEL_DISPLAY: Record<string, string> = {
  far_left: "Far Left",
  left: "Left",
  center: "Center",
  right: "Right",
  far_right: "Far Right",
};

/** Filter out unclassified entries from bias distribution arrays. */
function classified<T extends { label: string }>(items: T[]): T[] {
  return items.filter((b) => b.label !== "unclassified");
}

function biasColor(label: string): string {
  if (label === "unclassified") return "var(--ink-faint)";
  return `var(--bias-${label.replaceAll("_", "-")})`;
}

/** Resolves CSS custom property to a concrete color for Chart.js. */
function resolvedBiasColor(label: string): string {
  const css = getComputedStyle(document.documentElement);
  if (label === "unclassified") return css.getPropertyValue("--ink-faint").trim();
  return css.getPropertyValue(`--bias-${label.replaceAll("_", "-")}`).trim();
}

function themeColors() {
  const css = getComputedStyle(document.documentElement);
  return {
    ink: css.getPropertyValue("--ink-dim").trim(),
    grid: css.getPropertyValue("--rule").trim(),
    brand: css.getPropertyValue("--brand").trim(),
  };
}

/** Re-draw on theme change (data-theme attribute or prefers-color-scheme). */
function useThemeRedraw(draw: () => void) {
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
    };
  }, [draw]);
}

// ---------------------------------------------------------------------------
// 1. Overall Bias Distribution — horizontal bar chart
// ---------------------------------------------------------------------------

function OverallBiasChart({ data }: { data: AnalyticsOverview }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  const draw = useCallback(() => {
    if (!canvasRef.current) return;
    chartRef.current?.destroy();
    const { ink, grid } = themeColors();

    const dist = classified(data.bias_distribution);
    import("chart.js/auto").then(({ default: ChartJS }) => {
      if (!canvasRef.current) return;
      chartRef.current = new ChartJS(canvasRef.current, {
        type: "bar",
        data: {
          labels: dist.map(
            (b) => BIAS_LABEL_DISPLAY[b.label] ?? b.label,
          ),
          datasets: [
            {
              label: "Articles",
              data: dist.map((b) => b.count),
              backgroundColor: dist.map((b) =>
                resolvedBiasColor(b.label),
              ),
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
                label: (ctx) => {
                  const b = dist[ctx.dataIndex];
                  return `${b.count} articles (${b.percentage.toFixed(1)}%)`;
                },
              },
            },
          },
          scales: {
            x: {
              beginAtZero: true,
              ticks: { color: ink, precision: 0 },
              grid: { color: grid },
            },
            y: { ticks: { color: ink }, grid: { display: false } },
          },
        },
      });
    });
  }, [data]);

  useThemeRedraw(draw);
  useEffect(() => () => { chartRef.current?.destroy(); }, []);

  return (
    <div className="h-64">
      <canvas ref={canvasRef} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// 2. Coverage Timeline — area chart showing daily article volume
// ---------------------------------------------------------------------------

function CoverageTimeline({ timeline }: { timeline: TimelineResponse }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  const draw = useCallback(() => {
    if (!canvasRef.current || timeline.days.length === 0) return;
    chartRef.current?.destroy();
    const { ink, grid, brand } = themeColors();

    import("chart.js/auto").then(({ default: ChartJS }) => {
      if (!canvasRef.current) return;
      chartRef.current = new ChartJS(canvasRef.current, {
        type: "line",
        data: {
          labels: timeline.days.map((d) => d.date),
          datasets: [
            {
              label: "Articles",
              data: timeline.days.map((d) => d.total),
              borderColor: brand,
              backgroundColor: brand + "20",
              fill: true,
              tension: 0.3,
              pointRadius: timeline.days.length > 30 ? 0 : 3,
              pointHoverRadius: 5,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                title: (items) => items[0]?.label ?? "",
                label: (ctx) => `${ctx.parsed.y} articles`,
              },
            },
          },
          scales: {
            x: {
              ticks: {
                color: ink,
                maxTicksLimit: 10,
                maxRotation: 0,
              },
              grid: { color: grid },
            },
            y: {
              beginAtZero: true,
              ticks: { color: ink, precision: 0 },
              grid: { color: grid },
            },
          },
        },
      });
    });
  }, [timeline]);

  useThemeRedraw(draw);
  useEffect(() => () => { chartRef.current?.destroy(); }, []);

  return (
    <div className="h-72">
      <canvas ref={canvasRef} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// 3. Bias Trend — stacked area chart showing daily bias breakdown
// ---------------------------------------------------------------------------

function BiasTrend({ timeline }: { timeline: TimelineResponse }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  const draw = useCallback(() => {
    if (!canvasRef.current || timeline.days.length === 0) return;
    chartRef.current?.destroy();
    const { ink, grid } = themeColors();
    const labels = [...BIAS_LABELS];

    import("chart.js/auto").then(({ default: ChartJS }) => {
      if (!canvasRef.current) return;
      chartRef.current = new ChartJS(canvasRef.current, {
        type: "line",
        data: {
          labels: timeline.days.map((d) => d.date),
          datasets: labels.map((label) => ({
            label: BIAS_LABEL_DISPLAY[label],
            data: timeline.days.map((d) => d.bias[label] ?? 0),
            borderColor: resolvedBiasColor(label),
            backgroundColor: resolvedBiasColor(label) + "30",
            fill: false,
            tension: 0.3,
            pointRadius: 0,
            pointHoverRadius: 4,
          })),
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: false,
          interaction: { mode: "index", intersect: false },
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.y}`,
              },
            },
          },
          scales: {
            x: {
              ticks: { color: ink, maxTicksLimit: 10, maxRotation: 0 },
              grid: { color: grid },
            },
            y: {
              beginAtZero: true,
              ticks: { color: ink, precision: 0 },
              grid: { color: grid },
            },
          },
        },
      });
    });
  }, [timeline]);

  useThemeRedraw(draw);
  useEffect(() => () => { chartRef.current?.destroy(); }, []);

  return (
    <div className="h-72">
      <canvas ref={canvasRef} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// 4. Reporting Volume — horizontal bar chart, one bar per source
// ---------------------------------------------------------------------------

function VolumeChart({ data }: { data: AnalyticsOverview }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  const draw = useCallback(() => {
    if (!canvasRef.current) return;
    chartRef.current?.destroy();
    const { ink, grid, brand } = themeColors();
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
            y: { ticks: { color: ink }, grid: { display: false } },
          },
        },
      });
    });
  }, [data]);

  useThemeRedraw(draw);
  useEffect(() => () => { chartRef.current?.destroy(); }, []);

  const height = Math.max(200, data.publishers.length * 52);
  return (
    <div style={{ height }}>
      <canvas ref={canvasRef} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// 5. Bias Doughnut — one per publisher
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
    const dist = classified(publisher.bias_distribution);

    import("chart.js/auto").then(({ default: ChartJS }) => {
      if (!canvasRef.current) return;
      chartRef.current = new ChartJS(canvasRef.current, {
        type: "doughnut",
        data: {
          labels: dist.map(
            (b) => BIAS_LABEL_DISPLAY[b.label] ?? b.label,
          ),
          datasets: [
            {
              data: dist.map((b) => b.count),
              backgroundColor: dist.map((b) =>
                resolvedBiasColor(b.label),
              ),
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
                  const b = dist[ctx.dataIndex];
                  return ` ${BIAS_LABEL_DISPLAY[b.label]}: ${b.count} (${b.percentage.toFixed(1)}%)`;
                },
              },
            },
          },
        },
        plugins: [
          {
            id: "centerText",
            afterDraw(chart: { ctx: CanvasRenderingContext2D; width: number; height: number }) {
              const { ctx, width, height } = chart;
              ctx.save();
              ctx.font = `600 ${Math.round(height / 6)}px sans-serif`;
              ctx.fillStyle = ink;
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillText(String(publisher.article_count), width / 2, height / 2);
              ctx.restore();
            },
          },
        ],
      });
    });
  }, [publisher]);

  useThemeRedraw(draw);
  useEffect(() => () => { chartRef.current?.destroy(); }, []);

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
// 6. Most Covered Stories — ranked list with mini bias bars
// ---------------------------------------------------------------------------

function TopEventsList({ topEvents }: { topEvents: TopEventsResponse }) {
  const { t } = useI18n();

  if (topEvents.events.length === 0) return null;

  return (
    <div className="space-y-3">
      {topEvents.events.map((event, i) => {
        const totalBias = Object.values(event.bias_distribution).reduce(
          (a, b) => a + b,
          0,
        );
        return (
          <Link
            key={event.event_id}
            href={`/events/${event.event_id}`}
            className="flex items-start gap-4 rounded-lg border border-rule bg-surface p-4 transition-colors hover:border-rule-strong hover:bg-surface-2"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-2 font-mono text-sm font-semibold text-ink-dim">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-snug line-clamp-2">
                {event.title}
              </p>
              <p className="mt-1 text-xs text-ink-dim">
                {event.article_count} {t.analytics.articles} · {event.source_count}{" "}
                {t.analytics.sourcesLabel}
              </p>
              {/* Mini bias bar */}
              {totalBias > 0 && (
                <div className="mt-2 flex h-1.5 overflow-hidden rounded-full">
                  {BIAS_LABELS.filter((l) => event.bias_distribution[l] > 0).map(
                    (label) => (
                      <div
                        key={label}
                        style={{
                          width: `${(event.bias_distribution[label] / totalBias) * 100}%`,
                          backgroundColor: biasColor(label),
                        }}
                      />
                    ),
                  )}
                </div>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared bias legend
// ---------------------------------------------------------------------------

function BiasLegend() {
  const allLabels = [...BIAS_LABELS] as const;
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
// Main export
// ---------------------------------------------------------------------------

type Props = {
  data: AnalyticsOverview;
  timeline?: TimelineResponse;
  topEvents?: TopEventsResponse;
};

export function AnalyticsCharts({ data, timeline, topEvents }: Props) {
  const { t } = useI18n();

  return (
    <div className="space-y-8">
      {/* Overall Bias Distribution */}
      <section className="rounded-lg border border-rule bg-surface p-5">
        <h2 className="font-serif text-xl font-semibold">
          {t.analytics.biasDistribution}
        </h2>
        <p className="mt-1 text-sm text-ink-dim">
          {t.analytics.description}
        </p>
        <div className="mt-4">
          <OverallBiasChart data={data} />
        </div>
      </section>

      {/* Coverage Timeline */}
      {timeline && timeline.days.length > 1 && (
        <section className="rounded-lg border border-rule bg-surface p-5">
          <h2 className="font-serif text-xl font-semibold">
            {t.analytics.coverageTimeline}
          </h2>
          <p className="mt-1 text-sm text-ink-dim">
            {t.analytics.coverageTimelineDesc}
          </p>
          <div className="mt-4">
            <CoverageTimeline timeline={timeline} />
          </div>
        </section>
      )}

      {/* Bias Trend */}
      {timeline && timeline.days.length > 1 && (
        <section className="rounded-lg border border-rule bg-surface p-5">
          <h2 className="font-serif text-xl font-semibold">
            {t.analytics.biasTrend}
          </h2>
          <p className="mt-1 text-sm text-ink-dim">
            {t.analytics.biasTrendDesc}
          </p>
          <div className="mt-4">
            <BiasTrend timeline={timeline} />
          </div>
        </section>
      )}

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

      {/* Most Covered Stories */}
      {topEvents && topEvents.events.length > 0 && (
        <section>
          <h2 className="font-serif text-xl font-semibold">
            {t.analytics.mostCovered}
          </h2>
          <p className="mt-1 text-sm text-ink-dim">
            {t.analytics.mostCoveredDesc}
          </p>
          <div className="mt-4">
            <TopEventsList topEvents={topEvents} />
          </div>
        </section>
      )}

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
