"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { BIAS_LABELS, SOURCE_DISPLAY } from "@/lib/constants";
import { useI18n } from "@/lib/i18n/client";

type Props = {
  search?: string;
  source?: string;
  biasLabel?: string;
  dateFrom?: string;
  dateTo?: string;
};

const bareClass =
  "cursor-pointer bg-transparent py-1 font-semibold text-ink hover:text-brand";

function inputDateValue(value?: string) {
  return value?.slice(0, 10) ?? "";
}

export function ArticleFilters({ search, source, biasLabel, dateFrom, dateTo }: Props) {
  const router = useRouter();
  const { t } = useI18n();
  const [query, setQuery] = useState(search ?? "");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const params = new URLSearchParams();
    const nextSearch = String(form.get("search") ?? "").trim();
    const nextSource = String(form.get("source") ?? "");
    const nextBias = String(form.get("bias_label") ?? "");
    const nextDateFrom = String(form.get("date_from") ?? "");
    const nextDateTo = String(form.get("date_to") ?? "");

    if (nextSearch) params.set("search", nextSearch);
    if (nextSource) params.set("source", nextSource);
    if (nextBias) params.set("bias_label", nextBias);
    if (nextDateFrom) params.set("date_from", `${nextDateFrom}T00:00:00`);
    if (nextDateTo) params.set("date_to", `${nextDateTo}T23:59:59`);

    const queryString = params.toString();
    router.push(queryString ? `/articles?${queryString}` : "/articles");
  }

  function clear() {
    setQuery("");
    router.push("/articles");
  }

  return (
    <form
      onSubmit={submit}
      className="mb-8 flex flex-wrap items-center gap-x-5 gap-y-3 border-y border-rule py-3 text-sm"
    >
      <input
        name="search"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={t.filters.searchPlaceholder}
        aria-label={t.filters.searchNews}
        className="min-w-[220px] flex-1 border-b border-transparent bg-transparent py-1 text-base text-ink placeholder:text-ink-faint focus:border-ink focus:outline-none"
      />

      <select name="source" defaultValue={source ?? ""} aria-label={t.filters.source} className={bareClass}>
        <option value="">{t.filters.allSources}</option>
        {Object.entries(SOURCE_DISPLAY).map(([value, label]) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>

      <select name="bias_label" defaultValue={biasLabel ?? ""} aria-label={t.filters.bias} className={bareClass}>
        <option value="">{t.filters.allBiasLabels}</option>
        {BIAS_LABELS.map((value) => (
          <option key={value} value={value}>{t.bias[value]}</option>
        ))}
      </select>

      <span className="flex items-center gap-1.5 text-ink-dim">
        <input name="date_from" type="date" defaultValue={inputDateValue(dateFrom)} aria-label={t.filters.from} className={bareClass} />
        <span aria-hidden>–</span>
        <input name="date_to" type="date" defaultValue={inputDateValue(dateTo)} aria-label={t.filters.to} className={bareClass} />
      </span>

      <span className="flex items-center gap-4">
        <button type="submit" className="rounded-[3px] bg-brand px-3 py-1.5 font-semibold text-white hover:opacity-90">
          {t.filters.apply}
        </button>
        {(search || source || biasLabel || dateFrom || dateTo) && (
          <button type="button" onClick={clear} className="text-ink-dim underline underline-offset-2 hover:text-ink">
            {t.filters.clear}
          </button>
        )}
      </span>
    </form>
  );
}
