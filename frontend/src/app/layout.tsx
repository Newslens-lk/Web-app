import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Masthead } from "@/components/Masthead";
import { Footer } from "@/components/Footer";
import { LocaleProvider } from "@/lib/i18n/client";
import { getDictionary, getLocale } from "@/lib/i18n/server";

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
    <html lang={locale} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="bg-bg text-ink font-sans text-[15px] leading-relaxed">
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
