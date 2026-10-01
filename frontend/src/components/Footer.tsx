import { getDictionary } from "@/lib/i18n/server";

export function Footer() {
  const t = getDictionary();

  return (
    <footer className="border-t border-ink py-10 pb-12 text-xs text-ink-dim">
      <div className="mx-auto max-w-shell px-4 sm:px-6 flex flex-wrap justify-between gap-3">
        <div><p className="mb-4 font-serif text-xl font-bold text-ink">NewsLens.</p><span>{t.footer.credit}</span></div>
        <span>{t.footer.caveat}</span>
      </div>
    </footer>
  );
}
