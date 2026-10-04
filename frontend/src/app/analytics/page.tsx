import Link from "next/link";
import { getAnalytics, getTimeline, getTopEvents } from "@/lib/analytics";
import { AnalyticsCharts } from "@/components/AnalyticsCharts";
import { getDictionary } from "@/lib/i18n/server";

type Period = "today" | "week" | "month" | "all";

const PERIODS: Period[] = ["today", "week", "month", "all"];

function periodDates(period: Period): { date_from?: string; date_to?: string } {
  if (period === "all") return {};

  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const today = `${yyyy}-${mm}-${dd}`;

  if (period === "today") return { date_from: today, date_to: today };

  if (period === "week") {
    const day = now.getDay();
    const mondayOffset = day === 0 ? 6 : day - 1;
    const monday = new Date(now);
    monday.setDate(now.getDate() - mondayOffset);
    const mY = monday.getFullYear();
    const mM = String(monday.getMonth() + 1).padStart(2, "0");
    const mD = String(monday.getDate()).padStart(2, "0");
    return { date_from: `${mY}-${mM}-${mD}`, date_to: today };
  }

  // month
  return { date_from: `${yyyy}-${mm}-01`, date_to: today };
}

function periodLabel(period: Period, t: ReturnType<typeof getDictionary>) {
  const map: Record<Period, string> = {
    today: t.analytics.periodToday,
    week: t.analytics.periodWeek,
    month: t.analytics.periodMonth,
    all: t.analytics.periodAll,
  };
  return map[period];
}

type Props = { searchParams: Record<string, string | string[] | undefined> };

export default async function AnalyticsPage({ searchParams }: Props) {
  const t = getDictionary();
  const raw = typeof searchParams.period === "string" ? searchParams.period : "all";
  const period: Period = PERIODS.includes(raw as Period) ? (raw as Period) : "all";

  const dates = periodDates(period);
  const query = new URLSearchParams();
  if (dates.date_from) query.set("date_from", dates.date_from);
  if (dates.date_to) query.set("date_to", dates.date_to);

  const [overviewResult, timelineResult, topEventsResult] = await Promise.all([
    getAnalytics(query),
    getTimeline(query),
    getTopEvents(query),
  ]);

  const data = overviewResult.data;
  const timeline = timelineResult.data;
  const topEvents = topEventsResult.data;
  const error = overviewResult.error || timelineResult.error || topEventsResult.error;

  return (
    <div className="space-y-8">
      {/* Header */}
      <header>
        <p className="text-xs font-semibold uppercase tracking-widest text-amber">
          {t.analytics.title}
        </p>
        <h1 className="mt-2 font-serif text-xl font-semibold">
          {t.analytics.subtitle}
        </h1>
        <p className="mt-2 text-sm text-ink-dim">{t.analytics.description}</p>
      </header>

      {/* Period tabs */}
      <nav className="flex rounded-[3px] border border-rule bg-surface-2 p-1">
        {PERIODS.map((p) => (
          <Link
            key={p}
            href={`/analytics?period=${p}`}
            className={`flex-1 rounded-md px-3 py-2 text-center text-sm font-semibold transition-colors ${
              period === p
                ? "bg-surface text-ink shadow-1"
                : "text-ink-dim hover:text-ink"
            }`}
          >
            {periodLabel(p, t)}
          </Link>
        ))}
      </nav>

      {/* Error state */}
      {error && (
        <p
          role="alert"
          className="rounded-lg border border-amber bg-amber-tint p-4 text-sm"
        >
          {error}
        </p>
      )}

      {data && (
        <>
          {/* Stat cards — dominant bias as 4th card */}
          {(() => {
            const classifiedDist = data.bias_distribution.filter((b) => b.label !== "unclassified");
            const dominant = classifiedDist.reduce((a, b) => (b.count > a.count ? b : a), classifiedDist[0]);
            return (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {([
                  [t.analytics.totalArticles, data.total_articles],
                  [t.analytics.totalEvents, data.total_events],
                  [t.analytics.totalSources, data.total_sources],
                ] as const).map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-lg border border-rule bg-surface p-5"
                  >
                    <p className="font-mono text-3xl font-semibold">
                      {Number(value).toLocaleString("en-US")}
                    </p>
                    <p className="mt-2 text-sm text-ink-dim">{label}</p>
                  </div>
                ))}
                {data.total_articles > 0 && (
                  <div className="rounded-lg border border-rule bg-surface p-5">
                    <p className="font-mono text-3xl font-semibold">
                      {dominant.percentage.toFixed(0)}%
                    </p>
                    <p className="mt-2 text-sm text-ink-dim">
                      {t.analytics.dominantBias}{" "}
                      <span
                        className="inline-block rounded-sm px-1.5 py-0.5 text-xs font-semibold"
                        style={{
                          backgroundColor:
                            dominant.label === "unclassified"
                              ? "var(--ink-faint)"
                              : `var(--bias-${dominant.label.replaceAll("_", "-")})`,
                          color:
                            dominant.label === "unclassified"
                              ? "var(--ink)"
                              : `var(--bias-${dominant.label.replaceAll("_", "-")}-on)`,
                        }}
                      >
                        {t.bias[dominant.label as keyof typeof t.bias] ?? dominant.label}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Charts or empty state */}
          {data.total_articles === 0 ? (
            <p className="rounded-lg border border-rule bg-surface p-10 text-center text-ink-dim">
              {t.analytics.noData}
            </p>
          ) : (
            <AnalyticsCharts
              data={data}
              timeline={timeline ?? undefined}
              topEvents={topEvents ?? undefined}
            />
          )}
        </>
      )}
    </div>
  );
}
