import Link from "next/link";
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
}
