"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

type Tab = { id: string; label: string; content: ReactNode };

/** One view at a time, so no chart sits below the fold. Only the active panel is mounted. */
export function AnalyticsTabs({ tabs }: { tabs: Tab[] }) {
  const [active, setActive] = useState(tabs[0].id);
  const buttons = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    // Let a link such as /analytics#timeline open that view directly.
    const fromHash = () => {
      const id = window.location.hash.slice(1);
      if (tabs.some((tab) => tab.id === id)) setActive(id);
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, [tabs]);

  const select = (id: string, focus = false) => {
    setActive(id);
    try { window.history.replaceState(null, "", `#${id}`); } catch { /* Hash is a convenience only. */ }
    if (focus) buttons.current[id]?.focus();
  };

  const onKeyDown = (event: KeyboardEvent, index: number) => {
    const last = tabs.length - 1;
    const next = { ArrowRight: index === last ? 0 : index + 1, ArrowLeft: index === 0 ? last : index - 1, Home: 0, End: last }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    select(tabs[next].id, true);
  };

  const current = tabs.find((tab) => tab.id === active) ?? tabs[0];
  return <div>
    <div role="tablist" aria-label="Analytics views" className="flex gap-5 overflow-x-auto py-2">
      {tabs.map((tab, index) => {
        const selected = tab.id === current.id;
        return <button
          key={tab.id} id={`tab-${tab.id}`} role="tab" type="button" aria-selected={selected} aria-controls={`panel-${tab.id}`}
          tabIndex={selected ? 0 : -1} ref={(node) => { buttons.current[tab.id] = node; }}
          onClick={() => select(tab.id)} onKeyDown={(event) => onKeyDown(event, index)}
          className={`cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink whitespace-nowrap py-2 text-sm ${selected ? "font-semibold text-ink underline underline-offset-8" : "text-ink-dim hover:text-ink"}`}
        >{tab.label}</button>;
      })}
    </div>
    <div role="tabpanel" id={`panel-${current.id}`} aria-labelledby={`tab-${current.id}`} tabIndex={0} className="mt-4">
      {current.content}
    </div>
  </div>;
}
