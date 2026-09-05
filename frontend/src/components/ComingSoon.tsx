import Link from "next/link";

type Props = { title: string; blurb: string };

export function ComingSoon({ title, blurb }: Props) {
  return (
    <div className="max-w-[60ch] py-12">
      <span className="text-[11px] font-bold tracking-[0.09em] uppercase text-amber">
        Coming next
      </span>
      <h1 className="font-serif text-[30px] font-semibold leading-[1.15] text-balance mt-1.5">
        {title}
      </h1>
      <p className="text-ink-dim mt-4">{blurb}</p>
      <Link
        href="/"
        className="inline-block mt-6 text-[13.5px] font-semibold text-brand hover:underline"
      >
        ← Back to feed
      </Link>
    </div>
  );
}
