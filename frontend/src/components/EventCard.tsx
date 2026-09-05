import Link from "next/link";
import type { Event } from "@/lib/mock-events";
import { SpectrumBar } from "./SpectrumBar";
import { OutletStack } from "./OutletStack";

type Props = { event: Event };

export function EventCard({ event }: Props) {
  return (
    <Link
      href={`/story?event=${event.id}`}
      className="group bg-surface border border-rule rounded-[10px] p-[18px] flex flex-col gap-2.5 text-left transition-shadow transition-colors hover:border-rule-strong hover:shadow-card"
    >
      <span className="text-[11px] font-bold tracking-[0.09em] uppercase text-amber">
        {event.topic}
      </span>
      <h3 className="font-serif text-[17.5px] font-semibold leading-[1.28] text-balance">
        {event.headline}
      </h3>
      <p className="text-[13px] text-ink-dim leading-snug line-clamp-2">
        {event.dek}
      </p>
      <SpectrumBar distribution={event.distribution} />
      <div className="flex justify-between items-center text-[12px] text-ink-faint mt-0.5">
        <span>
          {event.outletCount} outlets · updated {event.updatedAgo}
        </span>
        <OutletStack outlets={event.outlets} />
      </div>
    </Link>
  );
}
