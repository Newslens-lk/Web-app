import type { CSSProperties, HTMLAttributes } from "react";

type Props = HTMLAttributes<HTMLDivElement> & {
  /** Thickness of the ring, in pixels. */
  borderWidth?: number;
  /** Seconds for one full pass. */
  duration?: number;
  /** One colour, or stops in the travelling gradient. */
  shineColor?: string | string[];
};

/**
 * An animated gradient edge, drawn over its parent's border.
 *
 * Sits inside the element it decorates rather than wrapping it — the parent
 * needs `relative` and `overflow-hidden`, and this inherits its radius:
 *
 *     <div className="relative overflow-hidden rounded-[3px] border …">
 *       <ShineBorder shineColor={["#c48820", "#E8A838"]} />
 *       …
 *     </div>
 *
 * The gradient is painted at 300% of the box and masked down to the border
 * area: two stacked masks, one clipped to the content box, composited to show
 * only their difference. Sliding the gradient's position reads as light
 * travelling round the edge, and nothing rotates, so it composites cheaply.
 *
 * Because the sweep is three times the box, it wants a card-sized surface. On
 * something button-sized the lit part of the gradient spends nearly all its
 * travel off the element, which looks like nothing happening at all.
 *
 * Written by hand rather than pulled in through shadcn's CLI: with no
 * components.json that runs `init` first, which rewrites globals.css and
 * tailwind.config.ts with its own token scheme.
 */
export function ShineBorder({
  borderWidth = 1,
  duration = 14,
  shineColor = "#000000",
  className = "",
  style,
  ...props
}: Props) {
  return (
    <div
      aria-hidden
      style={
        {
          "--shine-duration": `${duration}s`,
          padding: `${borderWidth}px`,
          backgroundImage: `radial-gradient(transparent, transparent, ${
            Array.isArray(shineColor) ? shineColor.join(", ") : shineColor
          }, transparent, transparent)`,
          backgroundSize: "300% 300%",
          // Order matters: each shorthand resets its own composite property,
          // so both composites are set after the shorthand they belong to.
          WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          maskComposite: "exclude",
          ...style,
        } as CSSProperties
      }
      className={`pointer-events-none absolute inset-0 size-full rounded-[inherit] will-change-[background-position] motion-safe:animate-shine ${className}`}
      {...props}
    />
  );
}
