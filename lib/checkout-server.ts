import { cookies } from "next/headers";
import { STORE_API, WP_URL, decodeEntities } from "./wp";
import type { WooCart } from "./types";

/**
 * Server-side half of the headless checkout.
 *
 * Every call to WooCommerce happens here, never in the browser: the customer's
 * session token stays in an httpOnly cookie and the WordPress host is never
 * exposed. Nothing in the purchase flow sends the shopper to WordPress.
 */

const TOKEN_COOKIE = "agfas_cart_token";

/**
 * The Store API will not return an order on the key alone — it also wants the
 * billing email, to stop anyone walking the order IDs. That email is personal
 * data, so it is kept in an httpOnly cookie rather than put in the URL where
 * it would leak through history, referrers and server logs.
 */
const ORDER_COOKIE = "agfas_last_order";

export type Address = {
  first_name: string;
  last_name: string;
  company?: string;
  address_1: string;
  address_2?: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  email?: string;
  phone?: string;
};

export type PaymentMethod = {
  id: string;
  title: string;
  description: string;
  offline: boolean;
};

export type ShippingRate = {
  rate_id: string;
  name: string;
  price: string;
  description: string;
  selected: boolean;
  currency_minor_unit: number;
  currency_prefix: string;
  currency_suffix: string;
};

export type PlaceOrderResult = {
  ok: boolean;
  error?: string;
  /** Where to send the shopper next — an internal confirmation URL, or a payment provider. */
  redirect?: string;
};

async function readToken(): Promise<string | undefined> {
  return (await cookies()).get(TOKEN_COOKIE)?.value;
}

async function persistToken(token: string | null) {
  if (!token) return;
  const store = await cookies();
  store.set(TOKEN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 2,
  });
}

/** Writes to the Store API need a nonce, which only comes back on a read. */
async function freshNonce(): Promise<string | null> {
  const token = await readToken();
  const headers = new Headers({ Accept: "application/json" });
  if (token) headers.set("Cart-Token", token);
  const res = await fetch(`${STORE_API}/cart`, { headers, cache: "no-store" });
  await persistToken(res.headers.get("Cart-Token"));
  return res.headers.get("Nonce");
}

async function call(path: string, init: RequestInit & { nonce?: string } = {}) {
  const token = await readToken();
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (token) headers.set("Cart-Token", token);
  if (init.nonce) headers.set("Nonce", init.nonce);
  if (init.body) headers.set("Content-Type", "application/json");

  const res = await fetch(`${STORE_API}${path}`, { ...init, headers, cache: "no-store" });
  await persistToken(res.headers.get("Cart-Token"));
  const body = await res.json().catch(() => null);
  return { res, body };
}

function messageFrom(body: unknown, fallback: string): string {
  if (body && typeof body === "object") {
    const b = body as { message?: unknown; data?: { params?: Record<string, string> } };
    // Field-level validation errors are more useful than the generic message.
    const params = b.data?.params;
    if (params && typeof params === "object") {
      const first = Object.values(params)[0];
      if (typeof first === "string" && first) return decodeEntities(first);
    }
    if (typeof b.message === "string" && b.message) return decodeEntities(b.message);
  }
  return fallback;
}

/* ---------------------------- customer + rates --------------------------- */

/**
 * Push the address into the cart so WooCommerce can work out shipping and tax.
 * Returns the recalculated cart.
 */
export async function updateCustomer(input: {
  billing_address?: Partial<Address>;
  shipping_address?: Partial<Address>;
}): Promise<{ cart: WooCart | null; error?: string }> {
  try {
    const nonce = await freshNonce();
    const { res, body } = await call("/cart/update-customer", {
      method: "POST",
      body: JSON.stringify(input),
      nonce: nonce ?? undefined,
    });
    if (!res.ok) return { cart: null, error: messageFrom(body, "That address could not be used.") };
    return { cart: body as WooCart };
  } catch {
    return { cart: null, error: "The store is unreachable right now." };
  }
}

export async function selectShippingRate(rateId: string): Promise<{ cart: WooCart | null; error?: string }> {
  try {
    const nonce = await freshNonce();
    const { res, body } = await call("/cart/select-shipping-rate", {
      method: "POST",
      body: JSON.stringify({ package_id: 0, rate_id: rateId }),
      nonce: nonce ?? undefined,
    });
    if (!res.ok) return { cart: null, error: messageFrom(body, "That delivery option is unavailable.") };
    return { cart: body as WooCart };
  } catch {
    return { cart: null, error: "The store is unreachable right now." };
  }
}

/* ------------------------------- gateways -------------------------------- */

export async function getPaymentMethods(): Promise<PaymentMethod[]> {
  try {
    const res = await fetch(`${WP_URL}/wp-json/agfas/v1/payment-methods`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60, tags: ["payment-methods"] },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? (data as PaymentMethod[]) : [];
  } catch {
    return [];
  }
}

/* ------------------------------ place order ------------------------------ */

type CheckoutResponse = {
  order_id?: number;
  order_key?: string;
  status?: string;
  payment_result?: {
    payment_status?: "success" | "pending" | "failure" | "error";
    payment_details?: Array<{ key: string; value: string }>;
    redirect_url?: string;
  };
};

export async function placeOrder(input: {
  billing_address: Address;
  shipping_address: Address;
  payment_method: string;
  customer_note?: string;
}): Promise<PlaceOrderResult> {
  try {
    const nonce = await freshNonce();
    const { res, body } = await call("/checkout", {
      method: "POST",
      body: JSON.stringify({
        billing_address: input.billing_address,
        shipping_address: input.shipping_address,
        payment_method: input.payment_method,
        customer_note: input.customer_note ?? "",
        payment_data: [],
      }),
      nonce: nonce ?? undefined,
    });

    if (!res.ok) {
      return { ok: false, error: messageFrom(body, "The order could not be placed.") };
    }

    const data = body as CheckoutResponse;
    const status = data.payment_result?.payment_status;
    const orderId = data.order_id;
    const orderKey = data.order_key;

    if (!orderId || !orderKey) {
      return { ok: false, error: "The order was not created. Nothing has been charged." };
    }

    const store = await cookies();
    store.set(
      ORDER_COOKIE,
      JSON.stringify({ id: orderId, email: input.billing_address.email ?? "" }),
      {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      },
    );

    const confirmation = `/order/${orderId}?key=${encodeURIComponent(orderKey)}`;

    if (status === "failure" || status === "error") {
      return {
        ok: false,
        error: messageFrom(body, "Payment was declined. Nothing has been charged."),
      };
    }

    // Some gateways finish off-site (a bank or wallet, never WordPress).
    const redirect = data.payment_result?.redirect_url;
    if (redirect && !redirect.startsWith(WP_URL)) {
      return { ok: true, redirect };
    }

    return { ok: true, redirect: confirmation };
  } catch {
    return { ok: false, error: "The store is unreachable right now. Nothing has been charged." };
  }
}

/* ------------------------------ order lookup ----------------------------- */

export type OrderSummary = {
  id: number;
  status: string;
  totals: {
    total_price: string;
    total_items: string;
    total_shipping: string | null;
    total_tax: string;
    currency_minor_unit: number;
    currency_prefix: string;
    currency_suffix: string;
  };
  items: Array<{ key: string; name: string; quantity: number; totals: { line_total: string } }>;
  billing_address: Address;
  payment_method?: string;
};

/** The billing email recorded when this browser placed an order. */
export async function lastOrderEmail(orderId: number): Promise<string | null> {
  const raw = (await cookies()).get(ORDER_COOKIE)?.value;
  if (!raw) return null;
  try {
    const saved = JSON.parse(raw) as { id?: number; email?: string };
    if (saved.id !== orderId) return null;
    return saved.email || null;
  } catch {
    return null;
  }
}

export async function getOrder(
  id: number,
  key: string,
  billingEmail?: string | null,
): Promise<OrderSummary | null> {
  try {
    const token = await readToken();
    const headers = new Headers({ Accept: "application/json" });
    if (token) headers.set("Cart-Token", token);

    const url = new URL(`${STORE_API}/order/${id}`);
    url.searchParams.set("key", key);
    if (billingEmail) url.searchParams.set("billing_email", billingEmail);

    const res = await fetch(url.toString(), { headers, cache: "no-store" });
    if (!res.ok) {
      console.error(`[order] ${res.status} looking up order ${id}`);
      return null;
    }
    return (await res.json()) as OrderSummary;
  } catch {
    return null;
  }
}
