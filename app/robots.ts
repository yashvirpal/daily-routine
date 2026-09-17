import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/server/app-url";

export default function robots(): MetadataRoute.Robots {
  const url = appUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Everything past login requires auth anyway (a crawler just gets
      // bounced to /login) — no point spending crawl budget on redirects,
      // and the admin panel shouldn't be indexed at all.
      disallow: ["/api/", "/admin", "/today", "/analytics", "/settings"],
    },
    sitemap: `${url}/sitemap.xml`,
  };
}
