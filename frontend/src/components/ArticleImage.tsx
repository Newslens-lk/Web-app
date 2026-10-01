"use client";

import { useState, type ReactNode } from "react";

type Props = { src: string | null; alt: string; className?: string; fallback?: ReactNode };

export function ArticleImage({ src, alt, className = "", fallback = null }: Props) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  if (!src || src === failedSrc) return <>{fallback}</>;

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
