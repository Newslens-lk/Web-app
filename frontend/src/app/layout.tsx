import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Masthead } from "@/components/Masthead";
import { Footer } from "@/components/Footer";
import { LocaleProvider } from "@/lib/i18n/client";
import { getDictionary, getLocale } from "@/lib/i18n/server";

/**
 * Three faces, each with one job.
 *
 * Newsreader sets headlines — a text serif drawn for screen news, so it holds
 * up at 14px in a card and at 72px on the cover. IBM Plex Sans handles the
 * interface: labels, buttons, metadata. Noto Serif Sinhala sits last in both
 * stacks so the browser reaches for it per character — Latin keeps Newsreader
 * or Plex, Sinhala gets a face actually drawn for it. Until now the stylesheet
 * named a Sinhala font but never loaded one, so every Sinhala headline was
 * rendering in whatever the OS happened to have.
 *
 * Fonts are loaded locally so the Docker build never needs to reach Google
 * Fonts at build time.
 */
const display = localFont({
  src: "../fonts/newsreader-latin.woff2",
  weight: "400 700",
  variable: "--font-display",
  display: "swap",
});

const ui = localFont({
  src: "../fonts/ibm-plex-sans-latin.woff2",
  weight: "400 600",
  variable: "--font-ui",
  display: "swap",
});

const sinhala = localFont({
  src: "../fonts/noto-serif-sinhala.woff2",
  weight: "400 700",
  variable: "--font-sinhala",
  display: "swap",
});

export function generateMetadata(): Metadata {
  return {
    title: "NewsLens",
    description: getDictionary().meta.description,
  };
}

// Lets the browser theme its own chrome (scrollbars, form controls) to match.
export const viewport: Viewport = {
  colorScheme: "light dark",
};

// Applies a stored theme choice before the first paint, so a reader who picked
// dark never sees a flash of the light palette. Runs synchronously in <head>
// and stays silent if storage is unavailable. With nothing stored it leaves the
// attribute off and the prefers-color-scheme rules in globals.css take over.
const themeScript = `(function(){try{var t=localStorage.getItem("theme");if(t==="dark"||t==="light"){document.documentElement.dataset.theme=t;}}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // The language lives in a cookie rather than localStorage so this server
  // render already knows it — no flash of the other language on first paint.
  const locale = getLocale();

  return (
    // The inline script mutates <html> before React hydrates, which React would
    // otherwise report as a server/client attribute mismatch.
    <html
      lang={locale}
      className={`${display.variable} ${ui.variable} ${sinhala.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="bg-bg text-ink font-sans text-base leading-relaxed">
        <LocaleProvider locale={locale}>
          <Masthead />
          <main className="mx-auto max-w-shell px-4 sm:px-6 py-8 pb-20">
            {children}
          </main>
          <Footer />
        </LocaleProvider>
      </body>
    </html>
  );
}
