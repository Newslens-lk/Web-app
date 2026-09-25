import Script from "next/script";

// Third-party embed — loads platform.js from elfsightcdn.com, which then
// scans the DOM for `.elfsight-app-*` classes and injects the widget into
// the matching div. `data-elfsight-app-lazy` defers the actual widget
// render until it scrolls into view.
//
// The app id below points at the specific weather widget configured in the
// project's Elfsight account — change city, units, theme, etc. there, not
// here. Deleting or unpublishing that widget in Elfsight will make this
// render blank, as will an ad blocker or an offline machine.
//
// Next.js's <Script> deduplicates by src, so mounting this component
// multiple times still only loads platform.js once.
const ELFSIGHT_APP_ID = "dd8fcc7f-3b93-4799-868a-24f860a8da96";

export function WeatherWidget() {
  return (
    <div className="bg-surface border border-rule rounded-[10px] p-5">
      <div className="text-xs font-bold uppercase tracking-wider text-ink-faint mb-3">
        Weather
      </div>
      <Script
        src="https://elfsightcdn.com/platform.js"
        strategy="afterInteractive"
      />
      <div
        className={`elfsight-app-${ELFSIGHT_APP_ID}`}
        data-elfsight-app-lazy
      />
    </div>
  );
}
