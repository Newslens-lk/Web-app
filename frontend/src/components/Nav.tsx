"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { getCurrentUser, logoutUser } from "@/lib/api";
import type { User } from "@/lib/types";

const links = [
  { href: "/", label: "Home" },
  { href: "/sources", label: "Sources" },
  { href: "/analytics", label: "Analytics" },
  { href: "/admin", label: "Admin" },
];

export function Nav() {
  const pathname = usePathname() ?? "/";
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    getCurrentUser().then(setUser).catch(() => setUser(null));
  }, [pathname]);

  async function handleLogout() {
    await logoutUser();
    setUser(null);
  }

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
      {user ? (
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-md border border-transparent px-3 py-2 text-[13.5px] font-semibold text-ink-dim hover:bg-surface-2 hover:text-ink"
        >
          Log out
        </button>
      ) : (
        <Link
          href="/login"
          className="rounded-md bg-brand px-3 py-2 text-[13.5px] font-semibold text-white hover:opacity-90"
        >
          Log in
        </Link>
      )}
    </nav>
  );
}
