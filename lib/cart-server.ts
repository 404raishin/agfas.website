import { cookies } from "next/headers";
import { decodeEntities, STORE_API } from "./wp";
import type { WooCart } from "./types";

/**
 * The Store API identifies a guest cart with a `Cart-Token` JWT and guards
 * writes with a short-lived `Nonce`. WordPress does not send CORS
 * allow-origin headers, so the browser cannot talk to it directly. Every cart
 * call is proxied here instead, and the token is kept in an httpOnly cookie
 * so the backend URL and session never reach client JavaScript.
 */
const TOKEN_COOKIE = "agfas_cart_token";
const TOKEN_MAX_AGE = 60 * 60 * 24 * 2; // Store API cart tokens expire after 48h.

export type CartResult = { cart: WooCart | null; error?: string };

const EMPTY_CART: WooCart = {
  items: [],
  items_count: 0,
  items_weight: 0,
  needs_payment: false,
  needs_shipping: false,
  totals: {
    total_items: "0",
    total_price: "0",
    total_tax: "0",
    currency_code: "MYR",
    currency_symbol: "RM",
    currency_minor_unit: 2,
    currency_prefix: "RM",
    currency_suffix: "",
  },
};

async function readToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(TOKEN_COOKIE)?.value;
}

async function persistToken(token: string | null) {
  if (!token) return;
  const store = await cookies();
  store.set(TOKEN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TOKEN_MAX_AGE,
  });
}

type StoreResponse = { res: Response; body: unknown };

async function callStore(
  path: string,
  init: RequestInit & { nonce?: string } = {},
): Promise<StoreResponse> {
  const token = await readToken();
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (token) headers.set("Cart-Token", token);
  if (init.nonce) headers.set("Nonce", init.nonce);
  if (init.body) headers.set("Content-Type", "application/json");

  const res = await fetch(`${STORE_API}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  await persistToken(res.headers.get("Cart-Token"));
  const body = await res.json().catch(() => null);
  return { res, body };
}

/** Writes need a fresh nonce, which only comes back on a cart read. */
async function freshNonce(): Promise<string | null> {
  const token = await readToken();
  const headers = new Headers({ Accept: "application/json" });
  if (token) headers.set("Cart-Token", token);

  const res = await fetch(`${STORE_API}/cart`, { headers, cache: "no-store" });
  await persistToken(res.headers.get("Cart-Token"));
  return res.headers.get("Nonce");
}

function asCart(body: unknown): WooCart | null {
  if (body && typeof body === "object" && "items" in body) return body as WooCart;
  return null;
}

function errorFrom(body: unknown, fallback: string): string {
  if (body && typeof body === "object" && "message" in body) {
    const message = (body as { message?: unknown }).message;
    if (typeof message === "string" && message) return decodeEntities(message);
  }
  return fallback;
}

export async function getCart(): Promise<CartResult> {
  try {
    const { res, body } = await callStore("/cart");
    if (!res.ok) return { cart: EMPTY_CART, error: errorFrom(body, "Could not load your cart.") };
    return { cart: asCart(body) ?? EMPTY_CART };
  } catch {
    return { cart: EMPTY_CART, error: "The store is unreachable right now." };
  }
}

async function mutate(path: string, payload: Record<string, unknown>, fallback: string): Promise<CartResult> {
  try {
    const nonce = await freshNonce();
    const { res, body } = await callStore(path, {
      method: "POST",
      body: JSON.stringify(payload),
      nonce: nonce ?? undefined,
    });
    if (!res.ok) return { cart: null, error: errorFrom(body, fallback) };
    return { cart: asCart(body) };
  } catch {
    return { cart: null, error: "The store is unreachable right now." };
  }
}

export function addItem(id: number, quantity = 1) {
  return mutate("/cart/add-item", { id, quantity }, "That product could not be added.");
}

export function updateItem(key: string, quantity: number) {
  return mutate("/cart/update-item", { key, quantity }, "That quantity could not be updated.");
}

export function removeItem(key: string) {
  return mutate("/cart/remove-item", { key }, "That item could not be removed.");
}

export { EMPTY_CART };
