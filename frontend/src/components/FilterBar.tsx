"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

import { useI18n } from "@/lib/i18n/client";

const selectClass =
  "bg-surface border border-rule-strong rounded-md px-3 py-[9px] text-sm text-ink min-w-[128px]";

export function FilterBar() {
  const router = useRouter();
  const params = useSearchParams();
  const { t } = useI18n();
  const [search, setSearch] = useState(params?.get("search") ?? "");

  const update = useCallback(
    (key: string, value: string) => {
      const sp = new URLSearchParams(params?.toString() ?? "");
      if (value && value !== "all") {
        sp.set(key, value);
      } else {
        sp.delete(key);
      }
      sp.delete("page");
      router.push(`/home?${sp.toString()}`);
    },
    [router, params],
  );

  const submitSearch = useCallback(
    (value: string) => {
      const sp = new URLSearchParams(params?.toString() ?? "");
      const trimmed = value.trim();
      if (trimmed) {
        sp.set("search", trimmed);
      } else {
        sp.delete("search");
      }
      sp.delete("page");
      router.push(`/home?${sp.toString()}`);
    },
    [router, params],
  );

  return (
    <div className="mb-6 space-y-3">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submitSearch(search);
        }}
        className="flex gap-2"
      >
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.home.searchPlaceholder}
          className="flex-1 rounded-md border border-rule-strong bg-surface px-3 py-[9px] text-sm text-ink placeholder:text-ink-faint"
        />
        <button
          type="submit"
          className="rounded-md bg-brand px-4 py-[9px] text-sm font-semibold text-brand-ink hover:brightness-95"
        >
          {t.filters.searchNews}
        </button>
      </form>

      <div className="flex flex-wrap items-center gap-2.5">
        <select
          aria-label={t.filters.source}
          className={selectClass}
          defaultValue={params?.get("source") ?? "all"}
          onChange={(e) => update("source", e.target.value)}
        >
          <option value="all">{t.filters.allSources}</option>
          <option value="hirunews">Hiru News</option>
          <option value="bbc_sinhala">BBC Sinhala</option>
          <option value="lankadeepa">Lankadeepa</option>
          <option value="newsfirst">NewsFirst</option>
          <option value="divaina">Divaina</option>
          <option value="Ada">Ada</option>
          <option value="Ada Derana Sinhala">Ada Derana Sinhala</option>
        </select>
        <select
          aria-label={t.filters.minimumSources}
          className={selectClass}
          defaultValue={params?.get("min_sources") ?? "all"}
          onChange={(e) => update("min_sources", e.target.value)}
        >
          <option value="all">{t.filters.anyCoverage}</option>
          <option value="2">{t.filters.twoPlusSources}</option>
          <option value="3">{t.filters.threePlusSources}</option>
        </select>
      </div>
    </div>
  );
}
