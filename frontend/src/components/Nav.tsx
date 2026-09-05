"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/story", label: "Compare Story" },
  { href: "/sources", label: "Sources" },
  { href: "/check", label: "Check an Article" },
  { href: "/about", label: "About" },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Primary" className="ml-auto flex flex-wrap gap-1">
      {links.map((link) => {
        const active =
          link.href === "/"
            ? pathname === "/"
            : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={[
              "rounded-md border border-transparent px-3 py-2 text-[13.5px] font-semibold whitespace-nowrap transition-colors",
              active
                ? "bg-brand-tint text-brand-ink"
                : "text-ink-dim hover:bg-surface-2 hover:text-ink",
            ].join(" ")}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
