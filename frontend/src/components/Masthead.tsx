import Link from "next/link";
import { Nav } from "./Nav";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageToggle } from "./LanguageToggle";
import { getDictionary } from "@/lib/i18n/server";

export function Masthead() {
  const t = getDictionary();
  return (
    <header className="border-b border-rule bg-bg">
      <div className="edition-strip">{t.landing.kicker}</div>
      <div className="masthead-grid mx-auto max-w-shell px-4 sm:px-6">
        <Link href="/" className="masthead-logo">NewsLens.</Link>
        <div className="masthead-nav"><Nav /></div>
        <div className="masthead-tools"><LanguageToggle /><ThemeToggle /></div>
      </div>
    </header>
  );
}
