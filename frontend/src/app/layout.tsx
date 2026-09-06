import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Masthead } from "@/components/Masthead";
import { DisclaimerBar } from "@/components/DisclaimerBar";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "NewsLens",
  description:
    "Compare how different Sri Lankan outlets report the same story — bias-aware Sinhala news aggregation.",
};

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
  return (
    // The inline script mutates <html> before React hydrates, which React would
    // otherwise report as a server/client attribute mismatch.
    <html lang="si" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="bg-bg text-ink font-sans text-[15px] leading-relaxed">
        <Masthead />
        <DisclaimerBar />
        <main className="mx-auto max-w-shell px-4 sm:px-6 py-8 pb-20">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
