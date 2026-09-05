import { sourceColor, sourceDisplayName } from "@/lib/constants";

type Props = { name: string };

export function SourceBadge({ name }: Props) {
  return (
    <span
      className="inline-block text-[11px] font-semibold text-white px-2 py-[2px] rounded"
      style={{ backgroundColor: sourceColor(name) }}
    >
      {sourceDisplayName(name)}
    </span>
  );
}
