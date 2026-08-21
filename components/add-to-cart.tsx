"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "./cart-provider";
import { QuantityInput } from "./quantity-input";

export function AddToCart({
  productId,
  productName,
  disabled,
}: {
  productId: number;
  productName: string;
  disabled?: boolean;
}) {
  const { add, busy, error } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const router = useRouter();

  async function handleAdd() {
    const ok = await add(productId, quantity);
    if (ok) {
      setAdded(true);
      setTimeout(() => setAdded(false), 2500);
    }
  }

  if (disabled) {
    return (
      <div className="rounded-full border border-line bg-mist px-6 py-3.5 text-center text-sm text-steel">
        Out of stock — <Link href="/quote" className="underline underline-offset-2">ask when it is back</Link>
      </div>
    );
  }

  return (
    <div>
      {/* One row at every width: `flex-1` in a column would set flex-basis on the
          height and collapse the button. */}
      <div className="flex gap-2.5 sm:gap-3">
        <QuantityInput
          value={quantity}
          label={productName}
          onChange={setQuantity}
          max={99}
        />

        <button
          type="button"
          onClick={handleAdd}
          disabled={busy}
          className="h-12 min-w-0 flex-1 rounded-full bg-solid px-4 text-sm font-medium text-on-solid transition-all hover:bg-flame-deep hover:text-on-flame disabled:opacity-55 sm:px-8"
        >
          {busy ? "Adding…" : added ? "Added to cart" : "Add to cart"}
        </button>
      </div>

      {added && (
        <button
          type="button"
          onClick={() => router.push("/cart")}
          className="mt-3 text-sm text-flame-deep underline underline-offset-4"
        >
          View cart and check out
        </button>
      )}

      {error && (
        <p role="alert" className="mt-3 text-sm text-flame-deep">
          {error}
        </p>
      )}

      <p className="mt-4 text-sm text-steel">
        Buying several, or need installation?{" "}
        <Link href="/quote" className="text-flame-deep underline underline-offset-4">
          Ask for a quotation
        </Link>
      </p>
    </div>
  );
}
