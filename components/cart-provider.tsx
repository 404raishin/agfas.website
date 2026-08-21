"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { WooCart } from "@/lib/types";

type CartContextValue = {
  cart: WooCart | null;
  count: number;
  busy: boolean;
  error: string | null;
  add: (id: number, quantity?: number) => Promise<boolean>;
  update: (key: string, quantity: number) => Promise<void>;
  remove: (key: string) => Promise<void>;
  /** Checkout recalculates the cart server-side; let it publish the result. */
  setCart: (cart: WooCart) => void;
  dismissError: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

type ApiResult = { cart: WooCart | null; error?: string };

async function post(body: unknown): Promise<ApiResult> {
  const res = await fetch("/api/cart", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return (await res.json().catch(() => ({ cart: null, error: "Something went wrong." }))) as ApiResult;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<WooCart | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inFlight, setInFlight] = useState(0);

  // Hydrate from the proxied Store API session on first paint.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/cart")
      .then((r) => r.json())
      .then((data: ApiResult) => {
        if (!cancelled && data.cart) setCart(data.cart);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const run = useCallback(async (body: unknown): Promise<boolean> => {
    setInFlight((n) => n + 1);
    setError(null);
    const data = await post(body);
    setInFlight((n) => n - 1);
    if (data.error) {
      setError(data.error);
      return false;
    }
    if (data.cart) setCart(data.cart);
    return true;
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      count: cart?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0,
      busy: inFlight > 0,
      error,
      add: (id, quantity = 1) => run({ action: "add", id, quantity }),
      update: async (key, quantity) => {
        await run({ action: "update", key, quantity });
      },
      remove: async (key) => {
        await run({ action: "remove", key });
      },
      setCart,
      dismissError: () => setError(null),
    }),
    [cart, inFlight, error, run],
  );


  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
