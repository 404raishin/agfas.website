import type { WooCategory, WooProduct, WpPage, WpPost } from "./types";

export const WP_URL = (process.env.WP_URL ?? "https://wp.agfasgas.com").replace(/\/$/, "");

export const STORE_API = `${WP_URL}/wp-json/wc/store/v1`;
export const WP_API = `${WP_URL}/wp-json/wp/v2`;

/** Catalog data changes rarely; ten minutes keeps pages fast but current. */
const CATALOG_REVALIDATE = 600;

type FetchOpts = { revalidate?: number; tags?: string[] };

async function getJson<T>(url: string, opts: FetchOpts = {}): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: {
        revalidate: opts.revalidate ?? CATALOG_REVALIDATE,
        tags: opts.tags,
      },
    });
    if (!res.ok) {
      console.error(`[wp] ${res.status} ${res.statusText} for ${url}`);
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    // A backend outage should degrade the page, never crash the render.
    console.error(`[wp] request failed for ${url}`, err);
    return null;
  }
}

function qs(params: Record<string, string | number | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

/* ------------------------------- products ------------------------------- */

export type ProductQuery = {
  perPage?: number;
  page?: number;
  search?: string;
  category?: string;
  orderby?: string;
  order?: "asc" | "desc";
  featured?: boolean;
};

export async function getProducts(query: ProductQuery = {}): Promise<WooProduct[]> {
  const url = `${STORE_API}/products${qs({
    per_page: query.perPage ?? 24,
    page: query.page ?? 1,
    search: query.search,
    category: query.category,
    orderby: query.orderby,
    order: query.order,
    featured: query.featured ? "true" : undefined,
  })}`;
  return (await getJson<WooProduct[]>(url, { tags: ["products"] })) ?? [];
}

export async function getProductBySlug(slug: string): Promise<WooProduct | null> {
  const list = await getJson<WooProduct[]>(
    `${STORE_API}/products${qs({ slug, per_page: 1 })}`,
    { tags: ["products", `product:${slug}`] },
  );
  return list?.[0] ?? null;
}

export async function getProductCategories(): Promise<WooCategory[]> {
  const url = `${STORE_API}/products/categories${qs({ per_page: 50, hide_empty: "true" })}`;
  return (await getJson<WooCategory[]>(url, { tags: ["products"] })) ?? [];
}

/* -------------------------------- content ------------------------------- */

export async function getPosts(perPage = 9): Promise<WpPost[]> {
  const url = `${WP_API}/posts${qs({ per_page: perPage, _embed: "wp:featuredmedia,author" })}`;
  return (await getJson<WpPost[]>(url, { tags: ["posts"] })) ?? [];
}

export async function getPostBySlug(slug: string): Promise<WpPost | null> {
  const url = `${WP_API}/posts${qs({ slug, _embed: "wp:featuredmedia,author" })}`;
  const list = await getJson<WpPost[]>(url, { tags: ["posts", `post:${slug}`] });
  return list?.[0] ?? null;
}

export async function getPageBySlug(slug: string): Promise<WpPage | null> {
  const list = await getJson<WpPage[]>(`${WP_API}/pages${qs({ slug })}`, { tags: ["pages"] });
  return list?.[0] ?? null;
}

/* -------------------------------- helpers ------------------------------- */

/** WordPress returns titles and excerpts as HTML entities. */
export function decodeEntities(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;|&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&(l|r)dquo;/g, '"')
    .replace(/&ndash;/g, "–")
    .replace(/&mdash;/g, "—")
    .replace(/&hellip;/g, "…")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}
