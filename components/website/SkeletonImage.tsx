"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface SkeletonImageProps extends Omit<ImageProps, "onLoad"> {
  containerClassName?: string;
  onLoad?: () => void;
}

export function SkeletonImage({
  src,
  alt,
  containerClassName,
  className,
  onLoad,
  ...props
}: SkeletonImageProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg bg-[#f5f3eb]",
        containerClassName
      )}
    >
      {!loaded && (
        <div
          className={cn(
            "ushnik-shimmer absolute inset-0 z-10 rounded-lg",
            "min-h-[120px]"
          )}
          aria-hidden
        />
      )}
      <Image
        src={src}
        alt={alt}
        className={cn(
          "rounded-lg object-cover transition-opacity duration-300",
          loaded ? "opacity-100" : "opacity-0",
          className
        )}
        onLoad={() => {
          setLoaded(true);
          onLoad?.();
        }}
        {...props}
      />
    </div>
  );
}
