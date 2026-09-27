"use client";

import { useState, useEffect, useCallback } from "react";
import { getCurrentUser, getPipelineStatus, getPipelineHistory, triggerPipeline } from "@/lib/api";
import { useI18n } from "@/lib/i18n/client";
import type { PipelineRun } from "@/lib/types";

const STATE_ICON: Record<string, string> = {
  success: "\u2705",
  failed: "\u274c",
  running: "\u23f3",
  queued: "\u23f3",
  scheduled: "\u23f3",
  up_for_retry: "\u26a0\ufe0f",
  unknown: "\u2026",
};

export default function AdminPage() {
  const { t } = useI18n();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [runs, setRuns] = useState<PipelineRun[]>([]);
  const [history, setHistory] = useState<PipelineRun[]>([]);
  const [triggering, setTriggering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(async () => {
    try {
      const [status, hist] = await Promise.all([
        getPipelineStatus(),
        getPipelineHistory(),
      ]);
      setRuns(status.runs ?? []);
      setHistory(hist.runs ?? []);
      setLastUpdated(new Date());
      setError(null);
    } catch {
      setError(t.admin.loadFailed);
    }
  }, [t]);

  useEffect(() => {
    getCurrentUser()
      .then((user) => {
        if (user.role !== "admin") throw new Error("not-admin");
        setAuthed(true);
      })
      .catch(() => setAuthed(false));
  }, []);

  useEffect(() => {
    if (!authed) return;
    load();
    const timer = window.setInterval(load, 5000);
    return () => window.clearInterval(timer);
  }, [authed, load]);

  async function handleTrigger() {
    setTriggering(true);
    try {
      await triggerPipeline();
      await load();
    } catch {
      setError(t.admin.triggerFailed);
    }
    setTriggering(false);
  }

  if (authed === null) {
    return <p className="py-12 text-[14px] text-ink-dim">{t.admin.checking}</p>;
  }

  if (!authed) {
    return (
      <div className="max-w-sm py-12">
        <h1 className="font-serif text-[24px] font-semibold mb-4">{t.admin.title}</h1>
        <button
          onClick={() => (window.location.href = "/admin/login")}
          className="bg-brand text-white px-4 py-2 rounded-md text-[14px] font-semibold hover:opacity-90"
        >
          {t.admin.loginButton}
        </button>
      </div>
    );
  }

  const latest = runs[0];
  const latestState = latest?.state ?? "unknown";
  const isActive = ["queued", "scheduled", "running", "up_for_retry"].includes(latestState);
  const completedTasks = latest?.tasks?.filter((task) => task.state === "success").length ?? 0;
  const taskCount = latest?.tasks?.length ?? 0;

  return (
    <div>
      <h1 className="font-serif text-[24px] font-semibold mb-6">{t.admin.title}</h1>

      {error && (
        <div className="bg-amber-tint border border-amber text-amber rounded-lg px-4 py-2 text-[13px] mb-4">
          {error}
        </div>
      )}

      <div className="bg-surface border border-rule rounded-lg p-5 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[15px] font-semibold mb-2">{t.admin.currentState}</h2>
            {latest ? (
              <>
                <p className="text-[13px] text-ink-dim">
                  {STATE_ICON[latestState] ?? ""} {latestState.toUpperCase()}
                  {taskCount > 0 && ` — ${t.admin.tasksComplete(completedTasks, taskCount)}`}
                </p>
                <p className="mt-1 text-[12px] text-ink-faint font-mono break-all">
                  {latest.dag_run_id}
                </p>
              </>
            ) : (
              <p className="text-[13px] text-ink-dim">{t.admin.noRuns}</p>
            )}
          </div>
          {lastUpdated && (
            <span className="text-[11px] text-ink-faint whitespace-nowrap">
              {t.admin.updatedAt(lastUpdated.toLocaleTimeString())}
            </span>
          )}
        </div>

        {latest && (latest.tasks ?? []).length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {(latest.tasks ?? []).map((t) => (
                <span
                  key={t.task_id}
                  className="bg-surface-2 border border-rule rounded px-2 py-1 text-[12px]"
                >
                  {STATE_ICON[t.state] ?? ""} {t.task_id}
                  {t.duration != null && (
                    <span className="text-ink-faint ml-1">
                      {Math.round(t.duration)}s
                    </span>
                  )}
                </span>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={handleTrigger}
        disabled={triggering || isActive}
        className="bg-brand text-white px-5 py-2.5 rounded-md text-[14px] font-semibold hover:opacity-90 disabled:opacity-50 mb-8"
      >
        {triggering ? t.admin.triggering : isActive ? t.admin.inProgress : `\u25b6 ${t.admin.trigger}`}
      </button>

      <h2 className="text-[15px] font-semibold mb-3">{t.admin.recentRuns}</h2>
      <div className="bg-surface border border-rule rounded-lg overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-rule text-left text-ink-dim">
              <th className="px-4 py-2 font-semibold">{t.admin.run}</th>
              <th className="px-4 py-2 font-semibold">{t.admin.state}</th>
              <th className="px-4 py-2 font-semibold">{t.admin.started}</th>
              <th className="px-4 py-2 font-semibold">{t.admin.ended}</th>
            </tr>
          </thead>
          <tbody>
            {history.map((run) => (
              <tr key={run.dag_run_id} className="border-b border-rule last:border-0">
                <td className="px-4 py-2 font-mono text-[12px]">{run.dag_run_id}</td>
                <td className="px-4 py-2">
                  {STATE_ICON[run.state] ?? ""} {run.state}
                </td>
                <td className="px-4 py-2 text-ink-dim">
                  {run.start_date ? new Date(run.start_date).toLocaleString() : "—"}
                </td>
                <td className="px-4 py-2 text-ink-dim">
                  {run.end_date ? new Date(run.end_date).toLocaleString() : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {history.length === 0 && (
          <p className="text-ink-dim text-center py-6 text-[13px]">{t.admin.noRuns}</p>
        )}
      </div>

      <div className="flex gap-3 mt-6 text-[13px]">
        <a
          href="http://localhost:8080"
          target="_blank"
          rel="noreferrer"
          className="text-brand font-semibold hover:underline"
        >
          {t.admin.openAirflow} &nearr;
        </a>
        <a
          href="http://localhost:9001"
          target="_blank"
          rel="noreferrer"
          className="text-brand font-semibold hover:underline"
        >
          {t.admin.openMinio} &nearr;
        </a>
      </div>
    </div>
  );
}
