"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "./cart-provider";
import { formatPrice } from "@/lib/format";
import { decodeEntities } from "@/lib/wp";
import { QuantityInput } from "./quantity-input";

export function CartView({ notice }: { notice?: "bridge-missing" | null }) {
  const { cart, busy, error, update, remove } = useCart();

  const noticeBanner =
    notice === "bridge-missing" ? (
      <p
        role="alert"
        className="mb-8 rounded-[var(--radius-card)] border border-flame bg-flame-soft px-5 py-4 text-sm leading-relaxed"
      >
        Checkout is not connected yet, so your cart could not be handed over.
        Nothing has been charged and your items are still here.{" "}
        <Link href="/quote" className="underline underline-offset-4">
          Request a quotation
        </Link>{" "}
        and we will take the order manually.
      </p>
    ) : null;

  if (!cart) {
    return (
      <>
        {noticeBanner}
        <p className="font-mono text-sm text-steel" aria-live="polite">
          Loading your cart…
        </p>
      </>
    );
  }

  if (cart.items.length === 0) {
    return (
      <>
        {noticeBanner}
        <div className="rounded-[var(--radius-card)] border border-dashed border-line bg-mist p-12 text-center">
        <p className="font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-steel">
          Cart empty
        </p>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-steel">
          Pick a detector for the gas you actually use — LPG for cylinders,
          natural gas for piped supply.
        </p>
        <Link
          href="/products"
          className="mt-6 inline-flex h-11 items-center rounded-full bg-solid px-6 text-sm font-medium text-on-solid transition-colors hover:bg-flame-deep"
        >
          Browse detectors
        </Link>
          <p className="mt-5 text-sm text-steel">
            Or{" "}
            <Link href="/quote" className="text-flame-deep underline underline-offset-4">
              ask for a quotation
            </Link>
            {" "}for a whole site.
          </p>
        </div>
      </>
    );
  }

  const money = cart.totals;

  return (
    <>
      {noticeBanner}
      <div className="grid gap-12 lg:grid-cols-[1.6fr_1fr] lg:gap-16">
      <div>
        {error && (
          <p role="alert" className="mb-5 rounded-lg border border-flame bg-flame-soft px-4 py-3 text-sm">
            {error}
          </p>
        )}

        <ul className="border-t border-line">
          {cart.items.map((item) => (
            <li key={item.key} className="flex gap-5 border-b border-line py-6">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-line bg-mist">
                {item.images?.[0] && (
                  <Image
                    src={item.images[0].src}
                    alt={item.images[0].alt || decodeEntities(item.name)}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                )}
              </div>

              <div className="flex min-w-0 flex-1 flex-col">
                <h2 className="text-base leading-snug font-semibold">
                  {decodeEntities(item.name)}
                </h2>
                <p className="mt-1 font-mono text-sm text-steel tabular-nums">
                  {formatPrice(item.prices.price, item.prices)} each
                </p>

                <div className="mt-auto flex items-center gap-4 pt-4">
                  <QuantityInput
                    size="sm"
                    value={item.quantity}
                    disabled={busy}
                    label={decodeEntities(item.name)}
                    onChange={(quantity) => update(item.key, quantity)}
                  />

                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => remove(item.key)}
                    className="text-sm text-steel underline underline-offset-4 transition-colors hover:text-flame-deep disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <span className="font-mono text-base tabular-nums">
                {formatPrice(item.totals.line_total, {
                  ...item.prices,
                  currency_minor_unit: item.totals.currency_minor_unit,
                })}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* summary */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-[var(--radius-card)] border border-line bg-mist p-7">
          <h2 className="font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-steel">
            Order summary
          </h2>

          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-steel">Subtotal</dt>
              <dd className="font-mono tabular-nums">{formatPrice(money.total_items, money)}</dd>
            </div>
            {Number(money.total_tax) > 0 && (
              <div className="flex justify-between">
                <dt className="text-steel">Tax</dt>
                <dd className="font-mono tabular-nums">{formatPrice(money.total_tax, money)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-steel">Shipping</dt>
              <dd className="text-steel">Calculated at checkout</dd>
            </div>
          </dl>

          <div className="hairline mt-5 flex items-baseline justify-between pt-5">
            <span className="font-semibold">Total</span>
            <span className="font-mono text-xl tabular-nums">
              {formatPrice(money.total_price, money)}
            </span>
          </div>

          <Link
            href="/checkout"
            className="mt-6 flex h-12 items-center justify-center rounded-full bg-flame px-6 text-sm font-medium text-on-flame transition-colors hover:bg-flame-deep"
          >
            Continue to checkout
          </Link>

          <Link
            href="/quote"
            className="mt-3 flex h-12 items-center justify-center rounded-full border border-line bg-paper px-6 text-sm font-medium transition-colors hover:border-flame hover:bg-flame-soft"
          >
            Request a quotation instead
          </Link>

          <p className="mt-4 text-center text-xs leading-relaxed text-steel">
            Secure checkout. You stay on agfasgas.com throughout.
          </p>
          </div>
        </aside>
      </div>
    </>
  );
}
