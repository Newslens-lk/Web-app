"use client";

import type { AnalyticsOverview, AnalyticsStories } from "@/lib/analytics";
import { BIAS_COLORS, BIAS_LABELS, BIAS_ON_COLORS, sourceDisplayName } from "@/lib/constants";
import { useI18n } from "@/lib/i18n/client";

const COLUMNS = "grid grid-cols-[6.5rem_1fr] items-center gap-x-3 sm:grid-cols-[9rem_1fr]";
const roundedLabel = (lean: number) => BIAS_LABELS[Math.min(4, Math.max(0, Math.round(lean) + 2))];

function publisherBar(p: AnalyticsOverview["publishers"][number]) {
  const counts = Object.fromEntries(p.bias_distribution.map((b) => [b.label, b.count])) as Record<string, number>;
  const n = BIAS_LABELS.reduce((sum, label) => sum + (counts[label] ?? 0), 0);
  if (n === 0) return null;
  const share = (label: string) => ((counts[label] ?? 0) * 100) / n;
  // Left-leaning articles extend left of the centre line and right-leaning ones extend right.
  // "Center" straddles the line, half on each side.
  const left = share("far_left") + share("left") + share("center") / 2;
  const right = share("far_right") + share("right") + share("center") / 2;
  return { name: p.source_name, n, share, counts, left, right, net: right - left };
}
type Bar = NonNullable<ReturnType<typeof publisherBar>>;

export function AnalyticsSpectrum({ overview, stories, part }: { overview: AnalyticsOverview; stories: AnalyticsStories | undefined; part: "spectrum" | "shared" }) {
  const { t } = useI18n();
  const bars = overview.publishers.flatMap((p) => publisherBar(p) ?? []).sort((a, b) => a.net - b.net);
  const side = Math.max(30, Math.ceil(Math.max(0, ...bars.flatMap((b) => [b.left, b.right])) / 10) * 10);
  const unit = 50 / side; // percent of the track per percent of a publisher's articles

  const segments = (bar: Bar) => {
    const [fl, l, c, r, fr] = BIAS_LABELS.map((label) => bar.share(label));
    const centerStart = 50 - (c / 2) * unit;
    const leftStart = centerStart - l * unit;
    const rightStart = 50 + (c / 2) * unit;
    const starts = [leftStart - fl * unit, leftStart, centerStart, rightStart, rightStart + r * unit];
    return BIAS_LABELS.map((label, i) => ({ label, start: starts[i], share: [fl, l, c, r, fr][i], count: bar.counts[label] ?? 0 }))
      .map((s) => ({ ...s, width: s.share * unit }));
  };

  const legend = <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
    {BIAS_LABELS.map((label) => <span key={label} className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-sm" style={{ backgroundColor: BIAS_COLORS[label] }} />{t.bias[label]}</span>)}
  </div>;

  const names = stories ? new Set(stories.pairs.flatMap((p) => [p.source_a, p.source_b])) : new Set<string>();
  const pairs = stories ? [...stories.pairs].sort((a, b) => b.differing_events / b.shared_events - a.differing_events / a.shared_events || b.shared_events - a.shared_events) : [];

  return <div className="space-y-12">
    {part === "spectrum" && <section>
      <h2 className="font-serif text-xl font-semibold">Which way does each publisher lean?</h2>
      <div className="mt-4">{legend}</div>
      <div className={`${COLUMNS} mt-5 text-xs text-ink-dim`} aria-hidden>
        <span />
        <div className="relative h-4"><span className="absolute left-0">More left</span><span className="absolute left-1/2 -translate-x-1/2">Center</span><span className="absolute right-0">More right</span></div>
      </div>
      <ol className="mt-1 space-y-2">
        {bars.map((bar) => <li key={bar.name} className={COLUMNS}>
          <span className="text-sm leading-tight">{sourceDisplayName(bar.name)}
            <span className="block text-xs text-ink-faint">{bar.n < 20 ? `Only ${bar.n} articles` : `${bar.n.toLocaleString("en-US")} articles`}</span>
          </span>
          <div className="relative h-9 bg-surface-2" role="img" aria-label={`${sourceDisplayName(bar.name)}: ${BIAS_LABELS.map((label) => `${t.bias[label]} ${bar.share(label).toFixed(0)}%`).join(", ")}`}>
            {segments(bar).filter((s) => s.width > 0).map((s) => <div
              key={s.label} className="absolute inset-y-0 flex items-center justify-center overflow-hidden text-xs font-semibold"
              style={{ left: `${s.start}%`, width: `${s.width}%`, backgroundColor: BIAS_COLORS[s.label], color: BIAS_ON_COLORS[s.label] }}
              title={`${t.bias[s.label]}: ${s.count} articles (${s.share.toFixed(1)}%)`}
            >{s.width >= 7 ? `${s.share.toFixed(0)}%` : ""}</div>)}
            <div className="absolute inset-y-0 left-1/2 w-px bg-ink" aria-hidden />
          </div>
        </li>)}
      </ol>
    </section>}

    {part === "shared" && <section>
      <h2 className="font-serif text-xl font-semibold">How does the same story read at different publishers?</h2>
      {overview.bias_label
        ? <p className="mt-2 text-sm text-ink-dim">Set the bias filter to &ldquo;Any bias&rdquo; to compare publishers.</p>
        : !stories
          ? <p role="alert" className="mt-2 border-l-2 border-amber pl-4 text-sm">Story comparisons are unavailable right now.</p>
          : stories.shared_events === 0
            ? <p className="mt-2 text-sm text-ink-dim">No story here was covered by two or more publishers.</p>
            : <>
              <p className="mt-1 text-sm text-ink-dim">{stories.shared_events.toLocaleString("en-US")} shared {stories.shared_events === 1 ? "story" : "stories"}, {stories.unanimous_events.toLocaleString("en-US")} where publishers agree. Biggest differences first.</p>
              <div className="mt-4">{legend}</div>
              <ol className="mt-4 divide-y divide-rule border-y border-rule">
                {stories.stories.map((story) => <li key={story.event_id} className="py-3">
                  <p className="text-sm font-semibold leading-snug">{story.headline}</p>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {story.dots.map((dot) => {
                      const label = roundedLabel(dot.lean);
                      return <li key={dot.source_name} className="rounded-[3px] px-2 py-1 text-xs font-semibold" style={{ backgroundColor: BIAS_COLORS[label], color: BIAS_ON_COLORS[label] }}>
                        {sourceDisplayName(dot.source_name)}: {t.bias[label]}
                      </li>;
                    })}
                  </ul>
                </li>)}
              </ol>

              {names.size > 1 && <div className="mt-12">
                <h3 className="font-serif text-lg font-semibold">Which publishers disagree most?</h3>
                <ol className="mt-3 space-y-2">
                  {pairs.map((pair) => {
                    const thin = pair.shared_events < stories.min_pair_events;
                    return <li key={`${pair.source_a}-${pair.source_b}`} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 text-sm sm:grid-cols-[14rem_1fr_auto]">
                      <span>{sourceDisplayName(pair.source_a)} and {sourceDisplayName(pair.source_b)}</span>
                      <div className="order-last col-span-2 h-3 bg-surface-2 sm:order-none sm:col-span-1" aria-hidden>
                        <div className="h-full bg-ink" style={{ width: `${(pair.differing_events * 100) / pair.shared_events}%`, opacity: thin ? 0.35 : 1 }} />
                      </div>
                      <span className="whitespace-nowrap text-ink-dim">{pair.differing_events} of {pair.shared_events} {pair.shared_events === 1 ? "story" : "stories"}{thin ? ", too few to trust" : ""}</span>
                    </li>;
                  })}
                </ol>
              </div>}
            </>}
    </section>}
  </div>;
}
