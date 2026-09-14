import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const url = process.env.APP_URL || "http://localhost:3000";
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
