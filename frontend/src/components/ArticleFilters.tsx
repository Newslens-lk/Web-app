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

const inputClass =
  "rounded-md border border-rule-strong bg-surface px-3 py-[9px] text-sm text-ink placeholder:text-ink-faint";

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
      className="mb-6 rounded-[3px] border border-rule bg-surface p-4 shadow-1"
    >
      <div className="grid gap-3 md:grid-cols-[minmax(220px,1.5fr)_1fr_1fr]">
        <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink-dim">
          {t.filters.searchNews}
          <input
            name="search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t.filters.searchPlaceholder}
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink-dim">
          {t.filters.source}
          <select name="source" defaultValue={source ?? ""} className={inputClass}>
            <option value="">{t.filters.allSources}</option>
            {Object.entries(SOURCE_DISPLAY).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink-dim">
          {t.filters.bias}
          <select name="bias_label" defaultValue={biasLabel ?? ""} className={inputClass}>
            <option value="">{t.filters.allBiasLabels}</option>
            {BIAS_LABELS.map((value) => (
              <option key={value} value={value}>{t.bias[value]}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-3 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink-dim">
          {t.filters.from}
          <input name="date_from" type="date" defaultValue={inputDateValue(dateFrom)} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink-dim">
          {t.filters.to}
          <input name="date_to" type="date" defaultValue={inputDateValue(dateTo)} className={inputClass} />
        </label>
        <button type="submit" className="rounded-md bg-brand px-4 py-[10px] text-sm font-semibold text-brand-ink hover:brightness-95">
          {t.filters.apply}
        </button>
        {(search || source || biasLabel || dateFrom || dateTo) && (
          <button type="button" onClick={clear} className="px-2 py-[10px] text-sm font-semibold text-ink-dim hover:text-ink">
            {t.filters.clear}
          </button>
        )}
      </div>
    </form>
  );
}
