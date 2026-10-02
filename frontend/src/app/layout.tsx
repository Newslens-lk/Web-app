import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Masthead } from "@/components/Masthead";
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
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // The language lives in a cookie rather than localStorage so this server
  // render already knows it — no flash of the other language on first paint.
  const locale = getLocale();

  return (
    <html
      lang={locale}
    >
      <body className="bg-bg text-ink font-sans text-base leading-relaxed">
        <LocaleProvider locale={locale}>
          <Masthead />
          <main className="mx-auto max-w-shell px-4 sm:px-6 py-8 pb-20">
            {children}
          </main>
        </LocaleProvider>
      </body>
    </html>
  );
}
