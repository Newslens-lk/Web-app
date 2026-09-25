"use client";

import { useState } from "react";

type Props = { src: string | null; alt: string; className?: string };

export function ArticleImage({ src, alt, className = "" }: Props) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
