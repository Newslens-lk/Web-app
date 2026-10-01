import type { CSSProperties } from "react";
import Link from "next/link";

import { getArticles, getStats } from "@/lib/api";
import { BIAS_COLORS, BIAS_LABELS } from "@/lib/constants";
import { getDictionary } from "@/lib/i18n/server";
import { NewsCollage } from "@/components/NewsCollage";

/** The original animated cover, restyled as layered newspaper clippings. */
export default async function LandingPage() {
  const t = getDictionary();

  // Settled rather than awaited together: an empty or unreachable database
  // should still render the cover, just without the pile.
  const [articlesResult, statsResult] = await Promise.allSettled([
    getArticles({ page_size: "12" }),
    getStats(),
  ]);

  const articles =
    articlesResult.status === "fulfilled" ? articlesResult.value.articles : [];
  const stats = statsResult.status === "fulfilled" ? statsResult.value : null;

  return (
    <section className="relative left-1/2 -mt-8 w-screen -translate-x-1/2 overflow-hidden isolate border-b border-rule bg-bg text-ink">
      <NewsCollage articles={articles} />

      {/* The pile runs under the text, so a wash from the left keeps the
          headline legible over whatever card happens to sit behind it. */}
      <div
        aria-hidden
        className="landing-wash pointer-events-none absolute inset-0 z-10"
      />

      <div className="relative z-20 mx-auto flex min-h-[80vh] max-w-shell flex-col justify-center px-4 py-20 sm:px-6">
        {/* The sequence is the argument: the claim, then the scale it rests
            on, then the evidence settling in behind it, then the way in. The
            delays below interleave with the collage's, which starts at 320ms. */}
        <div className="max-w-[34rem]">
          <p
            className="rise-in text-xs font-semibold uppercase tracking-eyebrow text-ink-dim"
            style={{ "--delay": "0ms" } as CSSProperties}
          >
            {t.landing.kicker}
          </p>

          <h1 className="landing-headline mt-5 font-serif font-semibold leading-[1.02] tracking-[-0.03em]">
            <span className="rise-in block" style={{ "--delay": "90ms" } as CSSProperties}>
              {t.landing.headlineTop}
            </span>
            <span
              className="rise-in block text-ink-dim"
              style={{ "--delay": "190ms" } as CSSProperties}
            >
              {t.landing.headlineBottom}
            </span>
          </h1>

          {/* The scale, stated once before any card uses it. It draws itself
              from the left, which is also the direction it reads in. */}
          <div
            className="draw-x mt-6 flex h-[6px] w-full max-w-[24rem] overflow-hidden"
            style={{ "--delay": "300ms" } as CSSProperties}
            role="img"
            aria-label={t.landing.spectrum}
          >
            {BIAS_LABELS.map((label) => (
              <span
                key={label}
                className="h-full flex-1"
                style={{ backgroundColor: BIAS_COLORS[label] }}
              />
            ))}
          </div>

          <p
            className="rise-in mt-7 max-w-[30rem] text-base leading-[1.7] text-ink-dim"
            style={{ "--delay": "430ms" } as CSSProperties}
          >
            {t.landing.standfirst}
          </p>

          <div
            className="rise-in mt-9 flex flex-wrap items-center gap-3"
            style={{ "--delay": "560ms" } as CSSProperties}
          >
            <Link
              href="/home"
              className="editorial-button"
            >
              {t.nav.home}
            </Link>
            <Link
              href="/login"
              className="inline-flex min-h-11 items-center border border-rule-strong px-6 py-3 text-sm font-semibold text-ink transition-colors hover:border-ink hover:bg-surface-2"
            >
              {t.nav.logIn}
            </Link>
          </div>

          {stats && (
            <p
              className="rise-in mt-12 font-mono text-xs uppercase tracking-eyebrow tabular-nums text-ink-dim"
              style={{ "--delay": "700ms" } as CSSProperties}
            >
              {t.landing.liveCounts(
                stats.total_articles,
                stats.total_events,
                stats.total_sources,
              )}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
