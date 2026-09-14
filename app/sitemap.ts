import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const url = process.env.APP_URL || "http://localhost:3000";
  const now = new Date();
  // Only the truly public pages — everything else requires auth (see robots.ts).
  return [
    { url: `${url}/login`, lastModified: now, priority: 1 },
    { url: `${url}/register`, lastModified: now, priority: 0.8 },
  ];
}
