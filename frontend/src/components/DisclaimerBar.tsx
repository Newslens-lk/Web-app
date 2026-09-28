import { getDictionary } from "@/lib/i18n/server";

export function DisclaimerBar() {
  const t = getDictionary();

  return (
    <div className="bg-surface-2 border-b border-rule text-sm text-ink-dim">
      <div className="mx-auto max-w-shell px-4 sm:px-6 py-2 flex items-start gap-2">
        <span
          aria-hidden
          className="flex-none w-[15px] h-[15px] rounded-full border-[1.4px] border-ink-faint flex items-center justify-center text-xs font-bold text-ink-faint mt-[1px]"
        >
          i
        </span>
        <span>
          <strong className="text-ink font-semibold">{t.disclaimer.lead}</strong>{" "}
          {t.disclaimer.rest}
        </span>
      </div>
    </div>
  );
}
