import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout-form";
import { getPaymentMethods } from "@/lib/checkout-server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false },
};

export default async function CheckoutPage() {
  // Fetched on the server so the browser never talks to WordPress.
  const paymentMethods = await getPaymentMethods();

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
