import type { MetadataRoute } from "next";

const SITE = (process.env.SITE_URL ?? "https://agfasgas.com").replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Per-visitor pages with nothing to index, and no value in crawl budget.
      disallow: ["/cart", "/checkout", "/order/", "/api/"],
    },
    sitemap: `${SITE}/sitemap.xml`,
  };
}
