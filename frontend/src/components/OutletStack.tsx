import type { Outlet } from "@/lib/mock-events";

type Props = { outlets: Outlet[]; limit?: number };

export function OutletStack({ outlets, limit = 4 }: Props) {
  const shown = outlets.slice(0, limit);
  return (
    <span className="flex">
      {shown.map((o, i) => (
        <span
          key={`${o.id}-${i}`}
          title={o.name}
          className={
            "w-[22px] h-[22px] rounded-full border-2 border-surface flex items-center justify-center text-[8.5px] font-bold text-white flex-none " +
            (i === 0 ? "" : "-ml-[7px]")
          }
          style={{ background: o.color }}
        >
          {o.short}
        </span>
      ))}
    </span>
  );
}
