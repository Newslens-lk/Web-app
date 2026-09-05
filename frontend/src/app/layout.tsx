import type { Metadata } from "next";
import "./globals.css";
import { Masthead } from "@/components/Masthead";
import { DisclaimerBar } from "@/components/DisclaimerBar";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "NewsLens",
  description:
    "Compare how different Sri Lankan outlets report the same story — bias-aware Sinhala news aggregation.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="si">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Sinhala:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
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
