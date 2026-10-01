import { cookies } from "next/headers";

import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "./config";
import { dictionaries, type Dictionary } from "./dictionaries";

/**
 * Locale for the current request, read from the cookie the masthead toggle
 * writes. Server-components only — `cookies()` throws in the browser bundle;
 * client components read the same value through `useI18n()`.
 *
 * Reading a cookie opts a route out of static rendering. Every page here
 * already fetches with `cache: "no-store"`, so nothing was static to lose.
 */
export function getLocale(): Locale {
  const stored = cookies().get(LOCALE_COOKIE)?.value;
  return isLocale(stored) ? stored : DEFAULT_LOCALE;
}

export function getDictionary(): Dictionary {
  return dictionaries[getLocale()];
}

/**
 * BCP-47 tag for `Intl` / `toLocaleDateString`, so month and weekday names
 * follow the chosen interface language instead of the server's default.
 */
export function getDateLocale(): string {
  return getLocale() === "si" ? "si-LK" : "en-LK";
}
