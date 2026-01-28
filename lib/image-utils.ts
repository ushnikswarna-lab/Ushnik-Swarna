const CLOUDINARY_BASE = /^https?:\/\/res\.cloudinary\.com\/[^/]+\/(image|video)\/upload\//;

export function isCloudinaryUrl(url: string): boolean {
  return typeof url === "string" && CLOUDINARY_BASE.test(url);
}

export interface CloudinaryTransformOptions {
  width?: number;
  height?: number;
  quality?: number | "auto";
  crop?: string;
  format?: "auto" | "webp" | "avif" | "jpg";
  /** Use for gallery thumbnails */
  thumbnail?: boolean;
}

/**
 * Append Cloudinary transform params to a Cloudinary URL.
 * Supports CDN, WebP/AVIF (f_auto), quality, and thumbnails.
 */
export function cloudinaryTransform(
  url: string,
  options: CloudinaryTransformOptions = {}
): string {
  if (!isCloudinaryUrl(url)) return url;

  const {
    width,
    height,
    quality = "auto",
    crop = "limit",
    format = "auto",
    thumbnail = false,
  } = options;

  const parts: string[] = [`f_${format === "auto" ? "auto" : format}`];
  if (thumbnail) {
    parts.push("c_fill", "g_auto");
  } else {
    parts.push(`c_${crop}`);
  }
  if (width) parts.push(`w_${width}`);
  if (height) parts.push(`h_${height}`);
  parts.push(`q_${quality}`);

  const transform = parts.join(",");
  return url.replace(
    /(\/upload\/)(v\d+\/)?/,
    `$1${transform}/$2`
  );
}

/** Thumbnail size for gallery / accommodation previews */
export const THUMB_SIZE = 80;
/** Default quality for optimized images */
export const DEFAULT_QUALITY = 80;
