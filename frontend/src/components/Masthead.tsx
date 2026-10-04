import Link from "next/link";
import { Nav } from "./Nav";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageToggle } from "./LanguageToggle";
import { BIAS_COLORS, BIAS_LABELS } from "@/lib/constants";

export function Masthead() {
  return (
    <header className="sticky top-0 z-30 border-b border-rule bg-masthead">
      <div className="mx-auto flex max-w-shell items-center gap-5 px-4 py-3.5 sm:px-6">
        <Link
          href="/"
          className="font-serif text-xl font-semibold leading-none tracking-[-0.03em]"
        >
          Newslens<span className="text-brand">.lk</span>
        </Link>
        <Nav />
        <LanguageToggle />
        <ThemeToggle />
      </div>

      {/* The scale itself, drawn once at the top of every page: the reader
          meets the five positions before the first headline, and every colour
          below refers back to this line. Two pixels, and the only place the
          full spectrum appears at equal weight. */}
      <div className="flex h-[2px] w-full" aria-hidden>
        {BIAS_LABELS.map((label) => (
          <span
            key={label}
            className="h-full flex-1"
            style={{ backgroundColor: BIAS_COLORS[label] }}
          />
        ))}
      </div>
    </header>
  );
}
