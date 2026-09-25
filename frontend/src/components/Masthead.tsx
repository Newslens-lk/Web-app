import Link from "next/link";
import { Nav } from "./Nav";

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
        <Nav />
      </div>
    </header>
  );
}
