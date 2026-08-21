import type { MetadataRoute } from "next";

/**
 * Rendered per request rather than at build time.
 *
 * The build happens on a developer machine, where `SITE_URL` points at
 * localhost. Baking this file would ship `Sitemap: http://localhost:3000/...`
 * to production and hide the sitemap from every crawler. Reading the variable
 * at request time lets the server's own value win.
 */
export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  const site = (process.env.SITE_URL ?? "https://agfasgas.com").replace(/\/$/, "");

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Per-visitor pages with nothing to index, and no value in crawl budget.
      disallow: ["/cart", "/checkout", "/order/", "/api/"],
    },
    sitemap: `${site}/sitemap.xml`,
  };
}
