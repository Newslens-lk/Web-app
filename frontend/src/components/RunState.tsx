"use client";

/**
 * A pipeline run's state, as a dot and a word.
 *
 * Replaces the emoji that stood here before. Emoji are drawn by the operating
 * system, so the same status rendered as a flat tick on one machine and a
 * glossy green badge on another, at a size nothing could control — and screen
 * readers announce them by their Unicode name ("white heavy check mark"),
 * which is not the state of anything.
 *
 * The dot borrows no colour from the bias scale. Green and red here are about
 * a job succeeding or failing, and they never appear next to an article.
 */
const TONE: Record<string, string> = {
  success: "bg-[#2E7D4F]",
  failed: "bg-[#C0392B]",
  running: "bg-[#B8860B] animate-pulse",
  queued: "bg-[#B8860B]",
  scheduled: "bg-[#B8860B]",
  up_for_retry: "bg-[#B8860B]",
  unknown: "bg-ink-faint",
};

type Props = {
  state: string;
  /** Off where the state sits beside a name that already identifies the row. */
  showLabel?: boolean;
  className?: string;
};

export function RunState({ state, showLabel = true, className }: Props) {
  const tone = TONE[state] ?? TONE.unknown;

  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      {/* The dot alone is never the only carrier of meaning: where the word is
          hidden, the title attribute still names the state. */}
      <span
        className={`h-2 w-2 shrink-0 rounded-full ${tone}`}
        title={showLabel ? undefined : state}
      />
      {showLabel && (
        <span className="font-mono text-xs uppercase tracking-eyebrow">{state}</span>
      )}
    </span>
  );
}
