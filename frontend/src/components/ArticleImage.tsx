"use client";

import { useState } from "react";

type Props = { src: string | null; alt: string; className?: string };

export function ArticleImage({ src, alt, className = "" }: Props) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  if (!src || src === failedSrc) {
    return (
      <div
        role="img"
        aria-label="No image available"
        className={`${className} flex items-center justify-center bg-surface-2 text-ink-faint text-sm`}
      >
        No image available
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      key={src}
      onError={() => setFailedSrc(src)}
      onLoad={(event) => {
        const image = event.currentTarget;
        if (image.naturalWidth < 320 || image.naturalHeight < 160) setFailedSrc(src);
      }}
      className={className}
    />
  );
}
