import type { Metadata } from "next";
import Link from "next/link";
import { CheckoutForm } from "@/components/checkout-form";
import { getPaymentMethods } from "@/lib/checkout-server";
import { checkoutEnabled, getSiteContent } from "@/lib/content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false },
};

export default async function CheckoutPage() {
  // Fetched on the server so the browser never talks to WordPress.
  const [paymentMethods, content] = await Promise.all([getPaymentMethods(), getSiteContent()]);

  if (!checkoutEnabled(content)) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-14 sm:px-8 sm:py-20">
        <p className="eyebrow">Checkout</p>
        <h1 className="mt-4 text-4xl sm:text-5xl">Ordering is paused</h1>
        <p className="mt-5 text-base leading-relaxed text-steel sm:text-lg">
          {content.checkout_message}
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          <Link
            href="/quote"
            className="inline-flex h-12 items-center rounded-full bg-flame px-8 text-sm font-medium text-on-flame transition-colors hover:bg-flame-deep"
          >
            Request a quotation
          </Link>
          <Link
            href="/cart"
            className="inline-flex h-12 items-center rounded-full border border-line px-7 text-sm font-medium transition-colors hover:bg-mist"
          >
            Back to cart
          </Link>
        </div>
        <p className="hairline mt-10 pt-6 text-sm leading-relaxed text-steel">
          Your cart is untouched. Anything in it is attached to the quotation
          automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
      <p className="eyebrow">
        <span className="status-dot" />
        Secure checkout
      </p>
      <h1 className="mt-4 text-4xl sm:text-5xl">Checkout</h1>

      <div className="mt-12">
        <CheckoutForm paymentMethods={paymentMethods} />
      </div>
    </div>
  );
}
