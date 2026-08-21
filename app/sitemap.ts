import type { MetadataRoute } from "next";
import { getPosts, getProducts } from "@/lib/wp";

export const revalidate = 3600;

const SITE = (process.env.SITE_URL ?? "https://agfasgas.com").replace(/\/$/, "");

/**
 * Products and posts are pulled live, so anything added in WordPress is
 * listed without a redeploy. Cart, checkout, quote and order pages are left
 * out — they are per-visitor and already marked noindex.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, posts] = await Promise.all([
    getProducts({ perPage: 100 }),
    getPosts(100),
  ]);

  const now = new Date();
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE}/products`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.6 },
    { url: `${SITE}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
  ];

  return [
    ...staticPages,
    ...products.map((product) => ({
      url: `${SITE}/products/${product.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...posts.map((post) => ({
      url: `${SITE}/blog/${post.slug}`,
      lastModified: new Date(post.modified || post.date),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];
}
