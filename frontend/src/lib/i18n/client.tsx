"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE, type Locale } from "./config";
import { dictionaries, type Dictionary } from "./dictionaries";

type I18nValue = {
  locale: Locale;
  t: Dictionary;
  setLocale: (next: Locale) => void;
};

const I18nContext = createContext<I18nValue | null>(null);

/**
 * Carries the locale into client components. Seeded from the cookie by the
 * root layout so the first client render matches the server's, avoiding a
 * hydration mismatch.
 */
export function LocaleProvider({
  locale: initialLocale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback(
    (next: Locale) => {
      // Cookie first: it is what the server reads on the refresh below, and
      // what restores the choice on the next visit.
      document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax`;
      document.documentElement.lang = next;
      setLocaleState(next);
      // Client components re-render from the state above; server components
      // (most of the page) only change once their HTML is re-fetched.
      router.refresh();
    },
    [router],
  );

  const value = useMemo<I18nValue>(
    () => ({ locale, t: dictionaries[locale], setLocale }),
    [locale, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) {
    throw new Error("useI18n must be used inside <LocaleProvider>");
  }
  return value;
}
