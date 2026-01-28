/** Cache-Control for public GET API responses. Use with fetch/NextResponse. */
export const API_CACHE_PUBLIC =
  "public, s-maxage=60, stale-while-revalidate=300";

export function apiCacheHeaders(): HeadersInit {
  return { "Cache-Control": API_CACHE_PUBLIC };
}
