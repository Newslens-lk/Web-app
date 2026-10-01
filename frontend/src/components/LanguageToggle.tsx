"use client";

import { LOCALES, type Locale } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/client";

/**
 * Masthead language switch.
 *
 * Both options are shown at once rather than one cycling button: a reader who
 * cannot read the current interface can still recognise their own language.
 * Each option is labelled in its own language for the same reason, so "සිංහල"
 * stays Sinhala even while the interface is in English.
 */
export function LanguageToggle() {
  const { locale, t, setLocale } = useI18n();

  return (
    <div
      role="group"
      aria-label={t.language.switcher}
      className="inline-flex flex-none rounded-full bg-surface-2 p-0.5 text-xs font-semibold"
    >
      {LOCALES.map((option: Locale) => {
        const active = option === locale;
        return (
          <button
            key={option}
            type="button"
            lang={option}
            onClick={() => setLocale(option)}
            aria-pressed={active}
            className={`rounded-full px-2.5 py-1 transition-colors ${
              active
                ? "bg-brand-tint text-brand-ink"
                : "text-ink-dim hover:text-ink"
            }`}
          >
            {t.language[option]}
          </button>
        );
      })}
    </div>
  );
}
