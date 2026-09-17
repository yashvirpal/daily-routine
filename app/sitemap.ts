import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/server/app-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const url = appUrl();
  const now = new Date();
  // Only the truly public pages — everything else requires auth (see robots.ts).
  return [
    { url: `${url}/login`, lastModified: now, priority: 1 },
    { url: `${url}/register`, lastModified: now, priority: 0.8 },
  ];
}
