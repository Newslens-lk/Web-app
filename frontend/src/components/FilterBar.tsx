"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

import { useI18n } from "@/lib/i18n/client";

const selectClass =
  "bg-surface border border-rule-strong rounded-md px-3 py-[9px] text-[13.5px] text-ink min-w-[128px]";

export function FilterBar() {
  const router = useRouter();
  const params = useSearchParams();
  const { t } = useI18n();

  const update = useCallback(
    (key: string, value: string) => {
      const sp = new URLSearchParams(params?.toString() ?? "");
      if (value && value !== "all") {
        sp.set(key, value);
      } else {
        sp.delete(key);
      }
      sp.delete("page");
      router.push(`/?${sp.toString()}`);
    },
    [router, params],
  );

  return (
    <div className="flex flex-wrap items-center gap-2.5 mb-6">
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
  );
}
