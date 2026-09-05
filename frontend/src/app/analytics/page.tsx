import { getStats } from "@/lib/api";
import { BIAS_DISPLAY, BIAS_COLORS, SOURCE_DISPLAY } from "@/lib/constants";
import type { BiasLabel } from "@/lib/types";

export default async function AnalyticsPage() {
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
    <div>
      <h1 className="font-serif text-[24px] font-semibold mb-6">Analytics</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {[
          { label: "Total Articles", value: stats.total_articles },
          { label: "Total Events", value: stats.total_events },
          { label: "Articles Today", value: stats.articles_today },
          { label: "Events Today", value: stats.events_today },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-surface border border-rule rounded-lg p-4 text-center"
          >
            <div className="font-mono text-[28px] font-semibold tabular-nums">
              {s.value}
            </div>
            <div className="text-[13px] text-ink-dim mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-surface border border-rule rounded-lg p-5">
          <h2 className="text-[15px] font-semibold mb-4">Bias Distribution</h2>
          <div className="flex flex-col gap-2.5">
            {biasEntries.map(([label, count]) => (
              <div key={label} className="flex items-center gap-2 text-[13px]">
                <span className="w-20 text-right text-ink-dim">
                  {BIAS_DISPLAY[label as BiasLabel] ?? label}
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
                <span className="font-mono text-[12px] w-12 text-right tabular-nums">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface border border-rule rounded-lg p-5">
          <h2 className="text-[15px] font-semibold mb-4">Articles per Source</h2>
          <div className="flex flex-col gap-2.5">
            {sourceEntries.map(([source, count]) => (
              <div key={source} className="flex items-center gap-2 text-[13px]">
                <span className="w-24 text-right text-ink-dim truncate">
                  {SOURCE_DISPLAY[source] ?? source}
                </span>
                <div className="flex-1 h-6 bg-surface-2 rounded overflow-hidden">
                  <div
                    className="h-full rounded bg-brand"
                    style={{ width: `${(count / maxSource) * 100}%` }}
                  />
                </div>
                <span className="font-mono text-[12px] w-12 text-right tabular-nums">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {stats.last_pipeline_run && (
        <p className="text-[12px] text-ink-faint mt-6">
          Last pipeline run: {new Date(stats.last_pipeline_run).toLocaleString()}
        </p>
      )}
    </div>
  );
}
