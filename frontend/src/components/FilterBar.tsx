// Filter bar for the home feed. UI-only for now — no state wired up until we
// have a real events API to filter against. Same input tokens keep the styling
// consistent between search, selects, and later the article-check textarea.

const selectClass =
  "bg-surface border border-rule-strong rounded-md px-3 py-[9px] text-[13.5px] text-ink min-w-[128px]";

export function FilterBar() {
  return (
    <div className="flex flex-wrap items-center gap-2.5 mb-6">
      <input
        type="search"
        placeholder="Search events, keywords, outlets…"
        aria-label="Search events"
        className="flex-1 min-w-[180px] bg-surface border border-rule-strong rounded-md px-3 py-[9px] text-[13.5px] text-ink placeholder:text-ink-faint"
      />
      <select aria-label="Topic" className={selectClass} defaultValue="all">
        <option value="all">All topics</option>
        <option>Politics</option>
        <option>Economy</option>
        <option>Foreign Affairs</option>
        <option>Crime &amp; Courts</option>
        <option>Infrastructure</option>
        <option>Sport</option>
      </select>
      <select
        aria-label="Date range"
        className={selectClass}
        defaultValue="week"
      >
        <option value="week">This week</option>
        <option value="today">Today</option>
        <option value="month">This month</option>
      </select>
      <select aria-label="Outlet" className={selectClass} defaultValue="all">
        <option value="all">All outlets</option>
        <option>Ada Derana</option>
        <option>Hiru News</option>
        <option>Lankadeepa</option>
        <option>Divaina</option>
        <option>ITN News</option>
      </select>
      <select aria-label="Sort" className={selectClass} defaultValue="covered">
        <option value="covered">Most covered</option>
        <option value="recent">Most recent</option>
      </select>
    </div>
  );
}
