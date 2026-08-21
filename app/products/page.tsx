import Link from "next/link";
import type { Metadata } from "next";
import { ProductCard } from "@/components/product-card";
import { getSiteContent } from "@/lib/content";
import { SortSelect } from "@/components/sort-select";
import { decodeEntities, getProductCategories, getProducts } from "@/lib/wp";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "Detectors and safety equipment",
  description:
    "Browse AGFAS gas leak detectors, alarms and fire safety equipment. Prices in MYR.",
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; search?: string; sort?: string }>;
}) {
  const { category, search, sort } = await searchParams;

  const [orderby, order] =
    sort === "price-asc"
      ? (["price", "asc"] as const)
      : sort === "price-desc"
        ? (["price", "desc"] as const)
        : sort === "title"
          ? (["title", "asc"] as const)
          : (["date", "desc"] as const);

  const [products, categories, t] = await Promise.all([
    getProducts({ perPage: 48, category, search, orderby, order }),
    getProductCategories(),
    getSiteContent(),
  ]);

  const activeCategory = categories.find((c) => c.slug === category);

  function href(next: Record<string, string | undefined>) {
    const sp = new URLSearchParams();
    const merged = { category, search, sort, ...next };
    for (const [k, v] of Object.entries(merged)) if (v) sp.set(k, v);
    const q = sp.toString();
    return q ? `/products?${q}` : "/products";
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
      <p className="eyebrow">
        <span className="status-dot" />
        Catalogue
      </p>
      <h1 className="mt-4 text-4xl sm:text-5xl">
        {activeCategory ? decodeEntities(activeCategory.name) : t.shop_title}
      </h1>
      <p className="mt-4 max-w-xl text-base leading-relaxed text-steel sm:text-lg">
        {activeCategory && activeCategory.description
          ? decodeEntities(activeCategory.description)
          : t.shop_lead}
      </p>

      {/* filters */}
      <div className="hairline mt-10 flex flex-col gap-5 pt-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          <Link
            href={href({ category: undefined })}
            className={`rounded-full border px-4 py-2 text-sm transition-colors ${
              !category ? "border-ink bg-solid text-on-solid" : "border-line hover:border-flame hover:bg-flame-soft"
            }`}
          >
            All
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={href({ category: cat.slug })}
              className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                category === cat.slug
                  ? "border-ink bg-solid text-on-solid"
                  : "border-line hover:border-flame hover:bg-flame-soft"
              }`}
            >
              {decodeEntities(cat.name)}
            </Link>
          ))}
        </div>

        <SortSelect />
      </div>

      {search && (
        <p className="mt-6 font-mono text-sm text-steel">
          Results for “{search}” — {products.length}
        </p>
      )}

      {/* Product cards are h3, so the grid needs an h2 above them or the
          heading order skips a level. It carries no visual weight. */}
      <h2 className="sr-only">Products</h2>

      {products.length > 0 ? (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="mt-10 rounded-[var(--radius-card)] border border-dashed border-line bg-mist p-12 text-center">
          <p className="font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-steel">
            Nothing here yet
          </p>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-steel">
            {category || search
              ? "No products match this filter. Clear it to see the full catalogue."
              : "Products published in WooCommerce show up here automatically."}
          </p>
          {(category || search) && (
            <Link
              href="/products"
              className="mt-6 inline-flex h-11 items-center rounded-full bg-solid px-6 text-sm font-medium text-on-solid transition-colors hover:bg-flame-deep"
            >
              Clear filters
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
