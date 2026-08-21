import type { MetadataRoute } from "next";
import { getPosts, getProducts } from "@/lib/wp";

/**
 * Rendered per request rather than at build time.
 *
 * The build happens on a developer machine, where `SITE_URL` points at
 * localhost. Baking the value in would publish a sitemap full of unreachable
 * localhost URLs. Reading it at request time lets the server's value win.
 *
 * Products and posts are pulled live too, so anything added in WordPress is
 * listed without a redeploy. Cart, checkout, quote and order pages are left
 * out — they are per-visitor and already marked noindex.
 */
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = (process.env.SITE_URL ?? "https://agfasgas.com").replace(/\/$/, "");

  const [products, posts] = await Promise.all([
    getProducts({ perPage: 100 }),
    getPosts(100),
  ]);

  const now = new Date();
  const staticPages: MetadataRoute.Sitemap = [
    { url: site, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${site}/products`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${site}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${site}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.6 },
    { url: `${site}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
  ];

  return [
    ...staticPages,
    ...products.map((product) => ({
      url: `${site}/products/${product.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...posts.map((post) => ({
      url: `${site}/blog/${post.slug}`,
      lastModified: new Date(post.modified || post.date),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];
}
