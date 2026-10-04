"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useI18n } from "@/lib/i18n/client";

export function Nav() {
  const pathname = usePathname() ?? "/";
  const { t } = useI18n();

  const links = [
    { href: "/home", label: t.nav.home },
    { href: "/sources", label: t.nav.sources },
    { href: "/analytics", label: t.nav.analytics },
  ];

  return (
    <nav aria-label={t.nav.label} className="ml-auto flex flex-wrap gap-1">
      {links.map((link) => {
        const active = pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={[
              "rounded-md border border-transparent px-3 py-2 text-sm font-semibold whitespace-nowrap transition-colors",
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
