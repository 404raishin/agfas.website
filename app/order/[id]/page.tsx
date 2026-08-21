import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getOrder, lastOrderEmail } from "@/lib/checkout-server";
import { formatPrice } from "@/lib/format";
import { decodeEntities } from "@/lib/wp";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Order confirmed",
  robots: { index: false },
};

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ key?: string }>;
};

export default async function OrderPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { key } = await searchParams;

  // The order key is what proves this visitor placed the order.
  if (!key) notFound();

  // WooCommerce wants the billing email alongside the key, so an order cannot
  // be read by guessing IDs. It is recalled from the cookie set when this
  // browser placed the order, rather than carried in the URL.
  const orderId = Number(id);
  const email = await lastOrderEmail(orderId);
  const order = await getOrder(orderId, key, email);

  if (!order) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-14 sm:px-8 sm:py-20">
        <p className="eyebrow">Order</p>
        <h1 className="mt-4 text-4xl sm:text-5xl">We cannot show this order</h1>
        <p className="mt-5 text-base leading-relaxed text-steel sm:text-lg">
          The link may have expired, or it was opened in a different browser
          from the one used to place the order. Your order itself is safe — the
          confirmation email has the details.
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          <Link
            href="/contact"
            className="inline-flex h-12 items-center rounded-full bg-solid px-7 text-sm font-medium text-on-solid transition-colors hover:bg-flame-deep hover:text-on-flame"
          >
            Ask us about this order
          </Link>
          <Link
            href="/products"
            className="inline-flex h-12 items-center rounded-full border border-line px-7 text-sm font-medium transition-colors hover:bg-mist"
          >
            Continue shopping
          </Link>
        </div>
      </div>
    );
  }

  const money = order.totals;

  return (
    <div className="mx-auto max-w-3xl px-5 py-14 sm:px-8 sm:py-20">
      <p className="eyebrow">
        <span className="status-dot" />
        Order {order.status}
      </p>
      <h1 className="mt-4 text-4xl sm:text-5xl">Thank you — your order is in</h1>
      <p className="mt-5 text-base leading-relaxed text-steel sm:text-lg">
        We have emailed a confirmation to{" "}
        <span className="text-ink">{order.billing_address.email}</span>. Keep
        order number <span className="font-mono text-ink">#{order.id}</span> for
        your records.
      </p>

      <div className="mt-12 rounded-[var(--radius-card)] border border-line bg-mist p-7">
        <h2 className="font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-steel">
          Order #{order.id}
        </h2>

        <ul className="mt-5 space-y-3 border-b border-line pb-5">
          {order.items.map((item) => (
            <li key={item.key} className="flex justify-between gap-4 text-sm">
              <span>
                {decodeEntities(item.name)}
                <span className="font-mono text-steel"> ×{item.quantity}</span>
              </span>
              <span className="shrink-0 font-mono tabular-nums">
                {formatPrice(item.totals.line_total, money)}
              </span>
            </li>
          ))}
        </ul>

        <dl className="mt-5 space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-steel">Subtotal</dt>
            <dd className="font-mono tabular-nums">{formatPrice(money.total_items, money)}</dd>
          </div>
          {money.total_shipping !== null && money.total_shipping !== undefined && (
            <div className="flex justify-between">
              <dt className="text-steel">Delivery</dt>
              <dd className="font-mono tabular-nums">
                {Number(money.total_shipping) === 0 ? "Free" : formatPrice(money.total_shipping, money)}
              </dd>
            </div>
          )}
        </dl>

        <div className="hairline mt-5 flex items-baseline justify-between pt-5">
          <span className="font-semibold">Total</span>
          <span className="font-mono text-xl tabular-nums">
            {formatPrice(money.total_price, money)}
          </span>
        </div>
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/products"
          className="inline-flex h-12 items-center rounded-full bg-solid px-7 text-sm font-medium text-on-solid transition-colors hover:bg-flame-deep hover:text-on-flame"
        >
          Continue shopping
        </Link>
        <Link
          href="/contact"
          className="inline-flex h-12 items-center rounded-full border border-line px-7 text-sm font-medium transition-colors hover:bg-mist"
        >
          Question about this order
        </Link>
      </div>
    </div>
  );
}
