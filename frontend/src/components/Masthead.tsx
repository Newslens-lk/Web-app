import Link from "next/link";
import { Nav } from "./Nav";
import { ThemeToggle } from "./ThemeToggle";

export function Masthead() {
  return (
    <header className="sticky top-0 z-30 bg-surface border-b border-rule">
      <div className="mx-auto max-w-shell px-4 sm:px-6 py-4 flex items-center gap-5">
        <Link
          href="/"
          className="flex items-baseline font-serif text-[25px] font-semibold"
        >
          <span>news</span>
          <span className="text-amber italic">Lens</span>
        </Link>
        <span className="hidden md:inline text-[11.5px] text-ink-faint tracking-wide ml-1 pl-3 border-l border-rule-strong">
          ප්‍රධාන පුවත් සංසන්දනය කරන්න — compare Sinhala news coverage
        </span>
        <Nav />
        <ThemeToggle />
      </div>
    </header>
  );
}
