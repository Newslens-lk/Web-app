import { getDictionary } from "@/lib/i18n/server";

export function Footer() {
  const t = getDictionary();

  return (
    <footer className="border-t border-rule py-7 pb-10 text-xs text-ink-faint">
      <div className="mx-auto max-w-shell px-4 sm:px-6 flex flex-wrap justify-between gap-3">
        <span>{t.footer.credit}</span>
        <span>{t.footer.caveat}</span>
      </div>
    </footer>
  );
}
