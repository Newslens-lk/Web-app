"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getCurrentUser } from "@/lib/api";
import type { User } from "@/lib/types";

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentUser()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="py-12 text-[14px] text-ink-dim">Loading account…</p>;
  }

  if (!user) {
    return (
      <div className="py-12">
        <h1 className="font-serif text-[24px] font-semibold">Account</h1>
        <p className="mt-2 text-[14px] text-ink-dim">Please log in to view your account.</p>
        <Link href="/login" className="mt-4 inline-block rounded-md bg-brand px-4 py-2 text-[14px] font-semibold text-white">
          Log in
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg py-8">
      <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-amber">Your account</p>
      <h1 className="mt-2 font-serif text-[30px] font-semibold">{user.display_name}</h1>
      <div className="mt-6 rounded-lg border border-rule bg-surface p-5 text-[14px]">
        <p><span className="text-ink-dim">Email:</span> {user.email}</p>
        <p className="mt-2"><span className="text-ink-dim">Account type:</span> Regular user</p>
      </div>
    </div>
  );
}
