"use client";

import Image from "next/image";
import { useState } from "react";
import { DEFAULT_SALON_IMAGE, resolveSalonImage } from "@/lib/salon-images";
import { cn } from "@/lib/utils";

type SalonImageProps = {
  src?: string | null;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  fill?: boolean;
  width?: number;
  height?: number;
};

/** Salon photo with fallback + direct Unsplash load (avoids flaky Vercel optimizer). */
export function SalonImage({
  src,
  alt,
  className,
  sizes,
  priority,
  fill,
  width,
  height,
}: SalonImageProps) {
  const [current, setCurrent] = useState(() => resolveSalonImage(src));

  return (
    <Image
      src={current}
      alt={alt}
      fill={fill}
      width={width}
      height={height}
      sizes={sizes}
      priority={priority}
      unoptimized
      className={cn(className)}
      onError={() => {
        if (current !== DEFAULT_SALON_IMAGE) {
          setCurrent(DEFAULT_SALON_IMAGE);
        }
      }}
    />
  );
}
