import type { CSSProperties } from "react";
import Link from "next/link";

import { getArticles, getStats } from "@/lib/api";
import { BIAS_COLORS, BIAS_LABELS } from "@/lib/constants";
import { getDictionary } from "@/lib/i18n/server";
import { NewsCollage } from "@/components/NewsCollage";

/**
 * The cover of the publication.
 *
 * A saturated plum ground with a pile of front pages scattered across it. The
 * reference for this was an orange collage; the arrangement is what was worth
 * taking, not the colour — this site already has a palette, and the five bias
 * colours must stay the only ones making a claim, so the ground is the brand's
 * own plum and the cards carry the only other colour on the page.
 *
 * The cards are not links. The two buttons are the way in; everything else is
 * there to show what the site does before anyone has clicked anything.
 */
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
    // Breaks out of the centred page shell to run edge to edge. `overflow-x:
    // clip` on the body absorbs the scrollbar's width.
    // The plum is fixed rather than `bg-brand`: that token lifts to a pale
    // pink in dark mode, which would leave this white text unreadable. A cover
    // keeps its own colour whichever theme the reading interface is in.
    <section className="relative left-1/2 -mt-8 w-screen -translate-x-1/2 overflow-hidden bg-[#5b2545] text-[#F3F1F2]">
      <NewsCollage articles={articles} />

      {/* The pile runs under the text, so a wash from the left keeps the
          headline legible over whatever card happens to sit behind it. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#5b2545] via-[#5b2545]/90 to-transparent lg:to-[#5b2545]/10"
      />

      <div className="relative z-50 mx-auto flex min-h-[80vh] max-w-shell flex-col justify-center px-4 py-20 sm:px-6">
        {/* The sequence is the argument: the claim, then the scale it rests
            on, then the evidence settling in behind it, then the way in. The
            delays below interleave with the collage's, which starts at 320ms. */}
        <div className="max-w-[34rem]">
          <p
            className="rise-in text-xs font-semibold uppercase tracking-eyebrow text-[#E8C878]"
            style={{ "--delay": "0ms" } as CSSProperties}
          >
            {t.landing.kicker}
          </p>

          <h1 className="mt-5 font-serif text-[clamp(2.6rem,7vw,4.5rem)] font-semibold leading-[1.02] tracking-[-0.03em]">
            <span className="rise-in block" style={{ "--delay": "90ms" } as CSSProperties}>
              {t.landing.headlineTop}
            </span>
            <span
              className="rise-in block text-[#D9A3C4]"
              style={{ "--delay": "190ms" } as CSSProperties}
            >
              {t.landing.headlineBottom}
            </span>
          </h1>

          {/* The scale, stated once before any card uses it. It draws itself
              from the left, which is also the direction it reads in. */}
          <div
            className="draw-x mt-6 flex h-[6px] w-full max-w-[24rem] overflow-hidden rounded-full"
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
            className="rise-in mt-7 max-w-[30rem] text-base leading-[1.7] text-[#E5D3DE]"
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
              className="rounded-[2px] bg-[#F3F1F2] px-6 py-3 text-base font-semibold text-[#3D1730] transition-opacity hover:opacity-85"
            >
              {t.nav.home}
            </Link>
            <Link
              href="/login"
              className="rounded-[2px] border border-[#8E5A77] px-6 py-3 text-base font-semibold text-[#F3F1F2] transition-colors hover:border-[#F3F1F2] hover:bg-white/10"
            >
              {t.nav.logIn}
            </Link>
          </div>

          {stats && (
            <p
              className="rise-in mt-12 font-mono text-xs uppercase tracking-eyebrow tabular-nums text-[#C49BB4]"
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
