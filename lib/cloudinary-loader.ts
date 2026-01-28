import type { ImageLoaderProps } from "next/image";
import { cloudinaryTransform, isCloudinaryUrl, DEFAULT_QUALITY } from "./image-utils";

/**
 * Next.js Image loader for Cloudinary URLs.
 * Adds w_, q_, f_auto for responsive images, WebP/AVIF, and compression.
 * Use as loader prop on <Image> when src is (or may be) Cloudinary.
 */
export default function cloudinaryLoader({ src, width, quality }: ImageLoaderProps): string {
  if (!isCloudinaryUrl(src)) return src;
  return cloudinaryTransform(src, {
    width,
    quality: quality ?? DEFAULT_QUALITY,
    crop: "limit",
    format: "auto",
  });
}

/** Options for thumbnail variant (e.g. gallery thumbs, accommodation strip). */
export function cloudinaryThumbLoader({ src, width, quality }: ImageLoaderProps): string {
  if (!isCloudinaryUrl(src)) return src;
  return cloudinaryTransform(src, {
    width: width || 80,
    height: width || 80,
    quality: quality ?? 75,
    thumbnail: true,
    format: "auto",
  });
}
