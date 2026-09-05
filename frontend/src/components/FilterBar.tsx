"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

const selectClass =
  "bg-surface border border-rule-strong rounded-md px-3 py-[9px] text-[13.5px] text-ink min-w-[128px]";

export function FilterBar() {
  const router = useRouter();
  const params = useSearchParams();

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
        aria-label="Source"
        className={selectClass}
        defaultValue={params?.get("source") ?? "all"}
        onChange={(e) => update("source", e.target.value)}
      >
        <option value="all">All sources</option>
        <option value="hirunews">Hiru News</option>
        <option value="bbc_sinhala">BBC Sinhala</option>
        <option value="lankadeepa">Lankadeepa</option>
        <option value="newsfirst">NewsFirst</option>
        <option value="divaina">Divaina</option>
      </select>
      <select
        aria-label="Minimum sources"
        className={selectClass}
        defaultValue={params?.get("min_sources") ?? "all"}
        onChange={(e) => update("min_sources", e.target.value)}
      >
        <option value="all">Any coverage</option>
        <option value="2">2+ sources</option>
        <option value="3">3+ sources</option>
      </select>
    </div>
  );
}
