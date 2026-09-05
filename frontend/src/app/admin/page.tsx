"use client";

import { useState, useEffect, useCallback } from "react";
import { getPipelineStatus, getPipelineHistory, triggerPipeline } from "@/lib/api";
import type { PipelineRun } from "@/lib/types";

const STATE_ICON: Record<string, string> = {
  success: "\u2705",
  failed: "\u274c",
  running: "\u23f3",
  queued: "\u23f3",
};

export default function AdminPage() {
  const [apiKey, setApiKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [runs, setRuns] = useState<PipelineRun[]>([]);
  const [history, setHistory] = useState<PipelineRun[]>([]);
  const [triggering, setTriggering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [status, hist] = await Promise.all([
        getPipelineStatus(apiKey),
        getPipelineHistory(apiKey),
      ]);
      setRuns(status.runs);
      setHistory(hist.runs);
      setError(null);
    } catch {
      setError("Failed to load pipeline data. Check your API key.");
    }
  }, [apiKey]);

  useEffect(() => {
    if (authed) load();
  }, [authed, load]);

  async function handleTrigger() {
    setTriggering(true);
    try {
      await triggerPipeline(apiKey);
      await load();
    } catch {
      setError("Failed to trigger pipeline.");
    }
    setTriggering(false);
  }

  if (!authed) {
    return (
      <div className="max-w-sm py-12">
        <h1 className="font-serif text-[24px] font-semibold mb-4">Admin Panel</h1>
        <label className="block text-[13px] text-ink-dim mb-1">API Key</label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          className="w-full bg-surface border border-rule-strong rounded-md px-3 py-2 text-[14px] text-ink mb-3"
        />
        <button
          onClick={() => setAuthed(true)}
          className="bg-brand text-white px-4 py-2 rounded-md text-[14px] font-semibold hover:opacity-90"
        >
          Login
        </button>
      </div>
    );
  }

  const latest = runs[0];

  return (
    <div>
      <h1 className="font-serif text-[24px] font-semibold mb-6">Admin Panel</h1>

      {error && (
        <div className="bg-amber-tint border border-amber text-amber rounded-lg px-4 py-2 text-[13px] mb-4">
          {error}
        </div>
      )}

      {latest && (
        <div className="bg-surface border border-rule rounded-lg p-5 mb-6">
          <h2 className="text-[15px] font-semibold mb-2">Pipeline Status</h2>
          <p className="text-[13px] text-ink-dim">
            Last run: {latest.start_date ? new Date(latest.start_date).toLocaleString() : "unknown"}{" "}
            — {STATE_ICON[latest.state] ?? ""} {latest.state.toUpperCase()}
          </p>
          {latest.tasks.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {latest.tasks.map((t) => (
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
      )}

      <button
        onClick={handleTrigger}
        disabled={triggering}
        className="bg-brand text-white px-5 py-2.5 rounded-md text-[14px] font-semibold hover:opacity-90 disabled:opacity-50 mb-8"
      >
        {triggering ? "Triggering…" : "\u25b6 Trigger Pipeline Run"}
      </button>

      <h2 className="text-[15px] font-semibold mb-3">Recent Runs</h2>
      <div className="bg-surface border border-rule rounded-lg overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-rule text-left text-ink-dim">
              <th className="px-4 py-2 font-semibold">Run</th>
              <th className="px-4 py-2 font-semibold">State</th>
              <th className="px-4 py-2 font-semibold">Started</th>
              <th className="px-4 py-2 font-semibold">Ended</th>
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
          <p className="text-ink-dim text-center py-6 text-[13px]">No pipeline runs found.</p>
        )}
      </div>

      <div className="flex gap-3 mt-6 text-[13px]">
        <a
          href="http://localhost:8080"
          target="_blank"
          rel="noreferrer"
          className="text-brand font-semibold hover:underline"
        >
          Open Airflow UI &nearr;
        </a>
        <a
          href="http://localhost:9001"
          target="_blank"
          rel="noreferrer"
          className="text-brand font-semibold hover:underline"
        >
          Open MinIO Console &nearr;
        </a>
      </div>
    </div>
  );
}
