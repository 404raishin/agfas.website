import type { Metadata } from "next";
import { CartView } from "@/components/cart-view";

export const metadata: Metadata = {
  title: "Your cart",
  robots: { index: false },
};

export default async function CartPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const { checkout } = await searchParams;
  return (
    <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
      <p className="eyebrow">Checkout</p>
      <h1 className="mt-4 text-4xl sm:text-5xl">Your cart</h1>
      <div className="mt-12">
        <CartView notice={checkout === "unavailable" ? "bridge-missing" : null} />
      </div>
    </div>
  );
}
