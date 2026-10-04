"use client";

import { useState } from "react";
import { summarizeEvent } from "@/lib/api";
import { useI18n } from "@/lib/i18n/client";

type Props = {
  eventId: string;
  /** Pre-existing summary from the server, if any. */
  initialSummary: string | null;
};

export function SummarizeButton({ eventId, initialSummary }: Props) {
  const { t } = useI18n();
  const [summary, setSummary] = useState(initialSummary);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  if (summary) {
    return (
      <div className="mt-6 rounded-[3px] border border-rule bg-surface p-5 shadow-1">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-eyebrow text-amber">
          {t.event.summaryTitle}
        </h2>
        <p className="text-base leading-relaxed">{summary}</p>
      </div>
    );
  }

  async function handleClick() {
    setLoading(true);
    setError(false);
    try {
      const result = await summarizeEvent(eventId);
      setSummary(result.summary);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="rounded-md bg-brand px-4 py-2.5 text-sm font-semibold text-brand-ink hover:brightness-95 disabled:opacity-50"
      >
        {loading ? t.event.summarizing : t.event.summarize}
      </button>
      {error && (
        <p className="mt-2 text-sm text-amber">{t.event.summaryError}</p>
      )}
    </div>
  );
}
