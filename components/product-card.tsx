import Image from "next/image";
import Link from "next/link";
import type { WooProduct } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { decodeEntities } from "@/lib/wp";

export function ProductCard({ product }: { product: WooProduct }) {
  const image = product.images?.[0];
  const category = product.categories?.[0];
  const onSale = product.on_sale && product.prices.regular_price !== product.prices.price;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-line bg-paper transition-all duration-200 hover:border-ink/20 hover:shadow-[0_18px_40px_-28px_rgba(22,25,29,0.45)]"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-mist">
        {image ? (
          <Image
            src={image.src}
            alt={image.alt || decodeEntities(product.name)}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="font-mono text-[0.625rem] uppercase tracking-[0.18em] text-steel">
              No image
            </span>
          </div>
        )}

        {onSale && (
          <span className="absolute left-3 top-3 rounded-full bg-flame px-2.5 py-1 font-mono text-[0.625rem] uppercase tracking-[0.14em] text-on-flame">
            Sale
          </span>
        )}
        {!product.is_in_stock && (
          <span className="absolute right-3 top-3 rounded-full bg-solid/85 px-2.5 py-1 font-mono text-[0.625rem] uppercase tracking-[0.14em] text-on-solid">
            Out of stock
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        {category && (
          <span className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-steel">
            {decodeEntities(category.name)}
          </span>
        )}
        <h3 className="mt-2 text-base leading-snug font-semibold tracking-[-0.01em]">
          {decodeEntities(product.name)}
        </h3>

        {product.short_description && (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-steel">
            {decodeEntities(product.short_description)}
          </p>
        )}

        <div className="mt-auto flex items-baseline gap-2 pt-5">
          <span className="font-mono text-lg tabular-nums">
            {formatPrice(product.prices.price, product.prices)}
          </span>
          {onSale && (
            <span className="font-mono text-sm text-steel line-through tabular-nums">
              {formatPrice(product.prices.regular_price, product.prices)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
