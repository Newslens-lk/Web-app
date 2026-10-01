"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { loginUser, registerUser } from "@/lib/api";
import { useI18n } from "@/lib/i18n/client";

type Mode = "login" | "register";

export default function LoginPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { t, locale } = useI18n();
  const isAdminLogin = pathname.startsWith("/admin/login");
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (mode === "register" && !isAdminLogin) {
        await registerUser({ email, display_name: displayName, password, locale });
      } else {
        await loginUser({ email, password });
      }
      router.push(isAdminLogin ? "/admin" : "/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.auth.genericError);
    } finally {
      setSubmitting(false);
    }
  }

  const isRegistering = mode === "register";

  return (
    <div className="rise-in mx-auto max-w-md py-8 sm:py-14">
      <div className="mb-7">
        <p className="text-sm font-semibold uppercase tracking-eyebrow text-amber">
          {isAdminLogin ? t.auth.adminKicker : t.auth.accountKicker}
        </p>
        <h1 className="mt-2 font-serif text-xl font-semibold">
          {isAdminLogin
            ? t.auth.adminTitle
            : isRegistering
              ? t.auth.registerTitle
              : t.auth.loginTitle}
        </h1>
        <p className="mt-2 text-base text-ink-dim">
          {isAdminLogin
            ? t.auth.adminIntro
            : isRegistering
              ? t.auth.registerIntro
              : t.auth.loginIntro}
        </p>
      </div>

      {!isAdminLogin && <div className="mb-5 flex rounded-none border border-rule bg-surface-2 p-1">
        {(["login", "register"] as Mode[]).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => {
              setMode(option);
              setError(null);
            }}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold ${
              mode === option ? "bg-surface text-ink shadow-1" : "text-ink-dim"
            }`}
          >
            {option === "login" ? t.auth.tabLogin : t.auth.tabRegister}
          </button>
        ))}
      </div>}

      <form
        onSubmit={handleSubmit}
        className="relative overflow-hidden rounded-none border border-rule bg-surface p-5 shadow-2"
      >
        {error && (
          <div className="mb-4 rounded-md border border-amber bg-amber-tint px-3 py-2 text-sm text-amber">
            {error}
          </div>
        )}

        {isRegistering && (
          <label className="mb-4 block text-sm font-semibold">
            {t.auth.displayName}
            <input
              required
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className="mt-1 w-full rounded-md border border-rule-strong bg-surface px-3 py-2 font-normal"
            />
          </label>
        )}

        <label className="mb-4 block text-sm font-semibold">
          {t.auth.email}
          <input
            required
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1 w-full rounded-md border border-rule-strong bg-surface px-3 py-2 font-normal"
          />
        </label>

        <label className="mb-5 block text-sm font-semibold">
          {t.auth.password}
          <input
            required
            minLength={8}
            type="password"
            autoComplete={isRegistering ? "new-password" : "current-password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1 w-full rounded-md border border-rule-strong bg-surface px-3 py-2 font-normal"
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-brand px-4 py-2.5 text-base font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          {submitting
            ? t.auth.submitting
            : isRegistering
              ? t.auth.tabRegister
              : t.auth.tabLogin}
        </button>
      </form>

      <Link href={isAdminLogin ? "/login" : "/"} className="mt-5 block text-center text-sm font-semibold text-brand hover:underline">
        {isAdminLogin ? t.auth.toUserLogin : t.auth.keepBrowsing}
      </Link>
    </div>
  );
}
