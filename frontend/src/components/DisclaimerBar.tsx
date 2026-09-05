export function DisclaimerBar() {
  return (
    <div className="bg-surface-2 border-b border-rule text-[12.5px] text-ink-dim">
      <div className="mx-auto max-w-shell px-4 sm:px-6 py-2 flex items-start gap-2">
        <span
          aria-hidden
          className="flex-none w-[15px] h-[15px] rounded-full border-[1.4px] border-ink-faint flex items-center justify-center text-[10px] font-bold text-ink-faint mt-[1px]"
        >
          i
        </span>
        <span>
          <strong className="text-ink font-semibold">
            Bias labels are model predictions,
          </strong>{" "}
          not verified facts — and outlet names shown throughout this prototype
          are illustrated with{" "}
          <strong className="text-ink font-semibold">
            placeholder demo data
          </strong>
          , not real assessments.
        </span>
      </div>
    </div>
  );
}
