import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AddToCart } from "@/components/add-to-cart";
import { ProductCard } from "@/components/product-card";
import { ProductGallery } from "@/components/product-gallery";
import { formatPrice } from "@/lib/format";
import { decodeEntities, getProductBySlug, getProducts } from "@/lib/wp";

export const revalidate = 600;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };

  const description = decodeEntities(product.short_description || product.description).slice(0, 160);
  return {
    title: decodeEntities(product.name),
    description,
    openGraph: {
      title: decodeEntities(product.name),
      description,
      images: product.images?.[0]?.src ? [product.images[0].src] : undefined,
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const category = product.categories?.[0];
  const related = category
    ? (await getProducts({ category: category.slug, perPage: 4 })).filter((p) => p.id !== product.id).slice(0, 3)
    : [];

  const onSale = product.on_sale && product.prices.regular_price !== product.prices.price;

  // WooCommerce already formats this ("6 in stock", "50 in stock (can be
  // backordered)") and honours the store's stock display settings, so prefer
  // its wording over inventing our own.
  const lowStock =
    typeof product.low_stock_remaining === "number" && product.low_stock_remaining > 0;
  const stockLabel = !product.is_in_stock
    ? "Out of stock"
    : lowStock
      ? `Only ${product.low_stock_remaining} left`
      : (product.stock_availability?.text ?? "In stock");

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
      <nav aria-label="Breadcrumb" className="font-mono text-xs text-steel">
        <Link href="/products" className="transition-colors hover:text-ink">
          Catalogue
        </Link>
        {category && (
          <>
            <span className="px-2">/</span>
            <Link href={`/products?category=${category.slug}`} className="transition-colors hover:text-ink">
              {decodeEntities(category.name)}
            </Link>
          </>
        )}
      </nav>

      <div className="mt-8 grid gap-12 lg:grid-cols-2 lg:gap-16">
        {/* gallery */}
        <ProductGallery images={product.images ?? []} name={decodeEntities(product.name)} />

        {/* detail */}
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`inline-flex items-center gap-2 font-mono text-[0.6875rem] uppercase tracking-[0.16em] ${
                lowStock ? "text-flame-deep" : product.is_in_stock ? "text-safe" : "text-steel"
              }`}
            >
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{
                  background: lowStock
                    ? "var(--color-flame-deep)"
                    : product.is_in_stock
                      ? "var(--color-safe)"
                      : "var(--color-steel)",
                }}
              />
              {stockLabel}
            </span>
            {product.sku && (
              <span className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-steel">
                SKU {product.sku}
              </span>
            )}
          </div>

          <h1 className="mt-4 text-3xl sm:text-4xl">{decodeEntities(product.name)}</h1>

          <div className="mt-5 flex items-baseline gap-3">
            <span className="font-mono text-3xl tabular-nums">
              {formatPrice(product.prices.price, product.prices)}
            </span>
            {onSale && (
              <span className="font-mono text-lg text-steel line-through tabular-nums">
                {formatPrice(product.prices.regular_price, product.prices)}
              </span>
            )}
          </div>

          {product.short_description && (
            <div
              className="mt-6 text-base leading-relaxed text-steel [&_p]:mb-3"
              dangerouslySetInnerHTML={{ __html: product.short_description }}
            />
          )}

          <div className="mt-8">
            <AddToCart
              productId={product.id}
              productName={decodeEntities(product.name)}
              disabled={!product.is_in_stock || !product.is_purchasable}
            />
          </div>

          {/* spec table — mono, because these are instrument readings */}
          {product.attributes?.length > 0 && (
            <dl className="hairline mt-10 pt-6">
              {product.attributes.map((attr) => (
                <div
                  key={attr.name}
                  className="flex justify-between gap-6 border-b border-line py-3 last:border-0"
                >
                  <dt className="text-sm text-steel">{decodeEntities(attr.name)}</dt>
                  <dd className="text-right font-mono text-sm">
                    {attr.terms.map((t) => decodeEntities(t.name)).join(", ")}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>

      {/* description */}
      {product.description && (
        <div className="hairline mt-16 pt-10">
          <h2 className="text-2xl">Product details</h2>
          <div
            className="mt-5 max-w-3xl text-base leading-relaxed text-steel [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:text-ink [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:text-ink [&_li]:mb-1.5 [&_p]:mb-4 [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-5"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
        </div>
      )}

      {related.length > 0 && (
        <div className="hairline mt-16 pt-10">
          <h2 className="text-2xl">Others in {decodeEntities(category!.name)}</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
