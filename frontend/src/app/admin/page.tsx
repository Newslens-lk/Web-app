"use client";

import { useState, useEffect, useCallback } from "react";
import { getCurrentUser, getPipelineStatus, getPipelineHistory, triggerPipeline } from "@/lib/api";
import { useI18n } from "@/lib/i18n/client";
import { RunState } from "@/components/RunState";
import type { PipelineRun } from "@/lib/types";

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
    return <p className="py-12 text-base text-ink-dim">{t.admin.checking}</p>;
  }

  if (!authed) {
    return (
      <div className="rise-in max-w-sm py-12">
        <h1 className="font-serif text-lg font-semibold mb-4">{t.admin.title}</h1>
        <button
          onClick={() => (window.location.href = "/admin/login")}
          className="bg-brand text-white px-4 py-2 rounded-md text-base font-semibold hover:opacity-90"
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
    <div className="rise-in">
      <h1 className="font-serif text-lg font-semibold mb-6">{t.admin.title}</h1>

      {error && (
        <div className="bg-amber-tint border border-amber text-amber rounded-[3px] px-4 py-2 text-sm mb-4">
          {error}
        </div>
      )}

      <div className="bg-surface border border-rule rounded-[3px] p-5 mb-6 shadow-1">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold mb-2">{t.admin.currentState}</h2>
            {latest ? (
              <>
                <p className="flex flex-wrap items-center gap-2 text-sm text-ink-dim">
                  <RunState state={latestState} />
                  {taskCount > 0 && (
                    <span>{t.admin.tasksComplete(completedTasks, taskCount)}</span>
                  )}
                </p>
                <p className="mt-1 text-sm text-ink-faint font-mono break-all">
                  {latest.dag_run_id}
                </p>
              </>
            ) : (
              <p className="text-sm text-ink-dim">{t.admin.noRuns}</p>
            )}
          </div>
          {lastUpdated && (
            <span className="text-xs text-ink-faint whitespace-nowrap">
              {t.admin.updatedAt(lastUpdated.toLocaleTimeString())}
            </span>
          )}
        </div>

        {latest && (latest.tasks ?? []).length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {/* Named `task`, not `t` — the dictionary is already `t` in this
                scope, and the shadowing made `t.admin.…` unreachable here. */}
            {(latest.tasks ?? []).map((task) => (
              <span
                key={task.task_id}
                className="flex items-center gap-2 rounded-[3px] border border-rule bg-surface-2 px-2 py-1 text-sm"
              >
                <RunState state={task.state} showLabel={false} />
                {task.task_id}
                {task.duration != null && (
                  <span className="font-mono text-xs text-ink-faint">
                    {Math.round(task.duration)}s
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
        className="bg-brand text-white px-5 py-2.5 rounded-md text-base font-semibold hover:opacity-90 disabled:opacity-50 mb-8"
      >
        {triggering ? t.admin.triggering : isActive ? t.admin.inProgress : `\u25b6 ${t.admin.trigger}`}
      </button>

      <h2 className="text-base font-semibold mb-3">{t.admin.recentRuns}</h2>
      <div className="bg-surface border border-rule rounded-[3px] overflow-hidden shadow-1">
        <table className="w-full text-sm">
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
                <td className="px-4 py-2 font-mono text-sm">{run.dag_run_id}</td>
                <td className="px-4 py-2">
                  <RunState state={run.state} />
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
          <p className="text-ink-dim text-center py-6 text-sm">{t.admin.noRuns}</p>
        )}
      </div>

      <div className="flex gap-3 mt-6 text-sm">
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
