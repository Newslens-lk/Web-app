export const LOCALES = ["en", "si"] as const;

export type Locale = (typeof LOCALES)[number];

/** What a first-time visitor sees. Change to "si" to open in Sinhala instead. */
export const DEFAULT_LOCALE: Locale = "en";

/** Read by the server on every render; written by the masthead toggle. */
export const LOCALE_COOKIE = "newslens_locale";

/** A year, so a reader's choice outlives the session. */
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function isLocale(value: string | null | undefined): value is Locale {
  return value === "en" || value === "si";
}
