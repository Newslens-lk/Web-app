export default function LoadingAnalytics() {
  return <div role="status" className="space-y-5 py-6">
    <p className="text-ink-dim">Loading analytics…</p>
    <div aria-hidden="true" className="h-40 animate-pulse rounded-lg bg-surface-2" />
    <div aria-hidden="true" className="h-64 animate-pulse rounded-lg bg-surface-2" />
  </div>;
}
