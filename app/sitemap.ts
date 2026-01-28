import type { MetadataRoute } from "next";
import { BASE_URL } from "@/lib/seo";

/** Static public website routes for sitemap. Excludes admin, dashboard, login, API. */
const STATIC_ROUTES: { path: string; priority: number; changeFrequency: "daily" | "weekly" | "monthly" | "yearly" }[] = [
  { path: "", priority: 1, changeFrequency: "weekly" },
  { path: "/about", priority: 0.9, changeFrequency: "monthly" },
  { path: "/accommodations", priority: 0.9, changeFrequency: "weekly" },
  { path: "/amenities", priority: 0.8, changeFrequency: "monthly" },
  { path: "/packages", priority: 0.9, changeFrequency: "weekly" },
  { path: "/gallery", priority: 0.8, changeFrequency: "weekly" },
  { path: "/contact", priority: 0.8, changeFrequency: "monthly" },
  { path: "/bookings", priority: 0.9, changeFrequency: "weekly" },
  { path: "/events", priority: 0.8, changeFrequency: "weekly" },
  { path: "/visit", priority: 0.7, changeFrequency: "monthly" },
  { path: "/help", priority: 0.7, changeFrequency: "monthly" },
  { path: "/faq", priority: 0.7, changeFrequency: "monthly" },
  { path: "/news", priority: 0.6, changeFrequency: "weekly" },
  { path: "/privacy-policy", priority: 0.4, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.4, changeFrequency: "yearly" },
  { path: "/code-of-conduct", priority: 0.4, changeFrequency: "yearly" },
  { path: "/site-map", priority: 0.5, changeFrequency: "monthly" },
  { path: "/track-booking", priority: 0.6, changeFrequency: "monthly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = STATIC_ROUTES.map(({ path, priority, changeFrequency }) => {
    const url = `${BASE_URL}${path}`;
    const entry: MetadataRoute.Sitemap[number] = {
      url,
      lastModified: new Date(),
      changeFrequency,
      priority,
    };
    if (path === "" || path === "/gallery") {
      entry.images =
        path === ""
          ? [`${BASE_URL}/logo.png`, `${BASE_URL}/assets/img/swimming-pool.jpg`]
          : [`${BASE_URL}/logo.png`];
    }
    return entry;
  });

  return entries;
}
