"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getCurrentUser } from "@/lib/api";
import { ShineBorder } from "@/components/ShineBorder";
import { useI18n } from "@/lib/i18n/client";
import type { User } from "@/lib/types";

export default function AccountPage() {
  const { t } = useI18n();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentUser()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="py-12 text-base text-ink-dim">{t.account.loading}</p>;
  }

  if (!user) {
    return (
      <div className="rise-in py-12">
        <h1 className="font-serif text-lg font-semibold">{t.account.title}</h1>
        <p className="mt-2 text-base text-ink-dim">{t.account.loginPrompt}</p>
        <Link href="/login" className="mt-4 inline-block rounded-md bg-brand px-4 py-2 text-base font-semibold text-white">
          {t.nav.logIn}
        </Link>
      </div>
    );
  }

  return (
    <div className="rise-in max-w-lg py-8">
      <p className="text-sm font-semibold uppercase tracking-eyebrow text-amber">{t.account.kicker}</p>
      <h1 className="mt-2 font-serif text-xl font-semibold">{user.display_name}</h1>
      <div className="relative mt-6 overflow-hidden rounded-[3px] border border-rule bg-surface p-5 text-base shadow-1">
        <ShineBorder borderWidth={1} duration={14} shineColor={["#5b2545", "#d9b65c", "#d9a3c4"]} />
        <p><span className="text-ink-dim">{t.account.email}</span> {user.email}</p>
        <p className="mt-2"><span className="text-ink-dim">{t.account.type}</span> {t.account.regularUser}</p>
      </div>
    </div>
  );
}
