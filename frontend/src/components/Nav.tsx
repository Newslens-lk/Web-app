"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { getCurrentUser, logoutUser } from "@/lib/api";
import type { User } from "@/lib/types";
import { useI18n } from "@/lib/i18n/client";

export function Nav() {
  const pathname = usePathname() ?? "/";
  const { t } = useI18n();
  const [user, setUser] = useState<User | null>(null);

  const links = [
    // The feed, not the landing page at "/" — the label is unchanged, only
    // where it points.
    { href: "/home", label: t.nav.home },
    { href: "/articles", label: t.articles.allArticles },
    { href: "/sources", label: t.nav.sources },
    { href: "/analytics", label: t.nav.analytics },
  ];

  useEffect(() => {
    getCurrentUser().then(setUser).catch(() => setUser(null));
  }, [pathname]);

  async function handleLogout() {
    await logoutUser();
    setUser(null);
  }

  return (
    <nav aria-label={t.nav.label} className="flex flex-wrap items-center gap-x-4 gap-y-2">
      {[...links, ...(user
        ? [{ href: user.role === "admin" ? "/admin" : "/account", label: user.role === "admin" ? t.nav.admin : t.nav.account }]
        : [])].map((link) => {
        const active = pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={[
              "border-b py-2 text-xs uppercase tracking-wide whitespace-nowrap transition-colors",
              active
                ? "border-ink text-ink"
                : "border-transparent text-ink-dim hover:border-ink hover:text-ink",
            ].join(" ")}
          >
            {link.label}
          </Link>
        );
      })}
      {user ? (
        <button
          type="button"
          onClick={handleLogout}
          className="py-2 text-xs uppercase tracking-wide text-ink-dim hover:text-ink"
        >
          {t.nav.logOut}
        </button>
      ) : (
        <Link
          href="/login"
          className="py-2 text-xs uppercase tracking-wide text-ink hover:underline"
        >
          {t.nav.logIn}
        </Link>
      )}
    </nav>
  );
}
