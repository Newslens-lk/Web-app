"use client";

import { useEffect, useState } from "react";

type Mode = "12" | "24";

// Pure-frontend widget. No backend involvement — reads the client machine's
// clock via `new Date()` and re-renders every second. `Intl.DateTimeFormat`
// picks up the visitor's locale + timezone automatically.
export function DigitalClock() {
  const [now, setNow] = useState<Date | null>(null);
  const [mode, setMode] = useState<Mode>("12");

  useEffect(() => {
    // Set immediately on mount so the first render after hydration shows
    // the real time, then tick every second.
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Server + first client render: reserve the card's footprint so the layout
  // doesn't jump when the clock hydrates. Also avoids a hydration mismatch —
  // the server has no notion of "now".
  if (!now) {
    return (
      <div
        aria-hidden
        className="bg-surface border border-rule rounded-[10px] p-5 min-h-[168px]"
      />
    );
  }

  const h24 = now.getHours();
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  const suffix = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 || 12;

  const timeMain =
    mode === "24"
      ? `${String(h24).padStart(2, "0")}:${mm}:${ss}`
      : `${String(h12).padStart(2, "0")}:${mm}:${ss}`;

  const dateLine = now.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const weekday = now.toLocaleDateString(undefined, { weekday: "long" });

  return (
    <div className="bg-surface border border-rule rounded-[10px] p-5">
      <div className="flex justify-between items-start gap-3 mb-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-ink-faint">
            Digital Clock
          </div>
          <div className="text-[11px] text-ink-faint mt-1">
            Updates every second · local time
          </div>
        </div>
        <div
          role="group"
          aria-label="Time format"
          className="inline-flex bg-surface-2 rounded-full p-0.5 text-[11px] font-semibold flex-none"
        >
          {(["12", "24"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              aria-pressed={mode === m}
              className={`px-2.5 py-1 rounded-full transition-colors ${
                mode === m
                  ? "bg-brand-tint text-brand-ink"
                  : "text-ink-dim hover:text-ink"
              }`}
            >
              {m} hr
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div
          className="font-mono tabular-nums text-[38px] leading-none font-bold text-ink"
          aria-live="off"
        >
          {timeMain}
          {mode === "12" && (
            <span className="text-[14px] font-semibold text-ink-dim ml-1.5">
              {suffix}
            </span>
          )}
        </div>
        <div className="text-right">
          <div className="text-[13px] text-ink">{dateLine}</div>
          <div className="text-[13px] text-ink-dim">{weekday}</div>
        </div>
      </div>
    </div>
  );
}
