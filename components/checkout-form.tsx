"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "./cart-provider";
import { QuantityInput } from "./quantity-input";
import { Recaptcha, RECAPTCHA_SITE_KEY } from "./recaptcha";
import { formatPrice } from "@/lib/format";
import { decodeEntities } from "@/lib/wp";
import type { WooCart } from "@/lib/types";
import type { PaymentMethod } from "@/lib/checkout-server";

/** WooCommerce's own state codes for Malaysia. */
const MY_STATES: Array<[string, string]> = [
  ["JHR", "Johor"],
  ["KDH", "Kedah"],
  ["KTN", "Kelantan"],
  ["KUL", "Kuala Lumpur"],
  ["LBN", "Labuan"],
  ["MLK", "Malacca (Melaka)"],
  ["NSN", "Negeri Sembilan"],
  ["PHG", "Pahang"],
  ["PNG", "Penang (Pulau Pinang)"],
  ["PJY", "Putrajaya"],
  ["PRK", "Perak"],
  ["PLS", "Perlis"],
  ["SBH", "Sabah"],
  ["SWK", "Sarawak"],
  ["SGR", "Selangor"],
  ["TRG", "Terengganu"],
];

type Form = {
  first_name: string;
  last_name: string;
  company: string;
  email: string;
  phone: string;
  address_1: string;
  address_2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  note: string;
};

const EMPTY: Form = {
  first_name: "",
  last_name: "",
  company: "",
  email: "",
  phone: "",
  address_1: "",
  address_2: "",
  city: "",
  state: "SGR",
  postcode: "",
  country: "MY",
  note: "",
};

export function CheckoutForm({ paymentMethods }: { paymentMethods: PaymentMethod[] }) {
  const { cart, setCart, update, busy } = useCart();
  const router = useRouter();

  const [form, setForm] = useState<Form>(EMPTY);
  const [payment, setPayment] = useState(paymentMethods[0]?.id ?? "");
  const [placing, setPlacing] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captcha, setCaptcha] = useState<string | null>(null);
  const [captchaReset, setCaptchaReset] = useState(0);

  const lastQuoted = useRef("");

  const set = (key: keyof Form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const packages = cart?.shipping_rates ?? [];
  const rates = packages[0]?.shipping_rates ?? [];
  const needsShipping = cart?.needs_shipping ?? false;

  /**
   * WooCommerce prices delivery from the address, so push it up as soon as
   * there is enough to quote on. Keyed so the same address is not re-sent.
   */
  const quoteShipping = useCallback(async () => {
    if (!needsShipping) return;
    const key = `${form.country}|${form.state}|${form.postcode}|${form.city}`;
    if (!form.postcode || !form.state || key === lastQuoted.current) return;
    lastQuoted.current = key;

    setCalculating(true);
    try {
      const res = await fetch("/api/checkout/customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shipping_address: {
            first_name: form.first_name,
            last_name: form.last_name,
            address_1: form.address_1,
            address_2: form.address_2,
            city: form.city,
            state: form.state,
            postcode: form.postcode,
            country: form.country,
          },
        }),
      });
      const data = (await res.json()) as { cart: WooCart | null; error?: string };
      if (data.cart) setCart(data.cart);
    } catch {
      // Leave the previous quote in place; placing the order will re-validate.
    } finally {
      setCalculating(false);
    }
  }, [form, needsShipping, setCart]);

  async function chooseRate(rateId: string) {
    setCalculating(true);
    try {
      const res = await fetch("/api/checkout/shipping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rate_id: rateId }),
      });
      const data = (await res.json()) as { cart: WooCart | null; error?: string };
      if (data.cart) setCart(data.cart);
      if (data.error) setError(data.error);
    } finally {
      setCalculating(false);
    }
  }

  // An empty cart means there is nothing to check out.
  useEffect(() => {
    if (cart && cart.items.length === 0) router.replace("/cart");
  }, [cart, router]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPlacing(true);

    const address = {
      first_name: form.first_name,
      last_name: form.last_name,
      company: form.company,
      address_1: form.address_1,
      address_2: form.address_2,
      city: form.city,
      state: form.state,
      postcode: form.postcode,
      country: form.country,
      email: form.email,
      phone: form.phone,
    };

    try {
      const res = await fetch("/api/checkout/place", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billing_address: address,
          shipping_address: address,
          payment_method: payment,
          customer_note: form.note,
          recaptchaToken: captcha,
        }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string; redirect?: string };

      if (!data.ok || !data.redirect) {
        setError(data.error ?? "The order could not be placed.");
        // The token is single-use, so a retry needs a fresh tick.
        setCaptcha(null);
        setCaptchaReset((n) => n + 1);
        setPlacing(false);
        return;
      }

      if (data.redirect.startsWith("/")) {
        router.push(data.redirect);
      } else {
        window.location.href = data.redirect;
      }
    } catch {
      setError("We could not reach the store. Nothing has been charged.");
      setPlacing(false);
    }
  }

  if (!cart) {
    return (
      <p className="font-mono text-sm text-steel" aria-live="polite">
        Loading your order…
      </p>
    );
  }

  const money = cart.totals;

  return (
    <form onSubmit={handleSubmit} className="grid gap-12 lg:grid-cols-[1.5fr_1fr] lg:gap-16">
      <div className="space-y-10">
        {/* ------------------------------ contact ----------------------------- */}
        <section>
          <h2 className="font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-steel">
            Contact
          </h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <Field label="Email" required value={form.email} onChange={set("email")} type="email" name="email" hint="Your receipt goes here" />
            <Field label="Phone" value={form.phone} onChange={set("phone")} type="tel" name="phone" hint="For delivery updates" />
          </div>
        </section>

        {/* ------------------------------ delivery ---------------------------- */}
        <section onBlur={quoteShipping}>
          <h2 className="font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-steel">
            Delivery address
          </h2>
          <div className="mt-5 space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="First name" required value={form.first_name} onChange={set("first_name")} name="first_name" />
              <Field label="Last name" required value={form.last_name} onChange={set("last_name")} name="last_name" />
            </div>
            <Field label="Company" value={form.company} onChange={set("company")} name="company" />
            <Field label="Address" required value={form.address_1} onChange={set("address_1")} name="address_1" />
            <Field label="Unit, floor, landmark" value={form.address_2} onChange={set("address_2")} name="address_2" />
            <div className="grid gap-5 sm:grid-cols-3">
              <Field label="City" required value={form.city} onChange={set("city")} name="city" />
              <div>
                <label htmlFor="state" className="mb-2 block text-sm font-medium">
                  State <span className="text-flame">*</span>
                </label>
                <select
                  id="state"
                  name="state"
                  value={form.state}
                  onChange={set("state")}
                  className="h-12 w-full rounded-lg border border-line bg-paper px-4 text-sm"
                >
                  {MY_STATES.map(([code, name]) => (
                    <option key={code} value={code}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              <Field label="Postcode" required value={form.postcode} onChange={set("postcode")} name="postcode" inputMode="numeric" />
            </div>
          </div>
        </section>

        {/* ------------------------------ shipping ---------------------------- */}
        {needsShipping && (
          <section>
            <h2 className="font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-steel">
              Delivery method
            </h2>
            {rates.length > 0 ? (
              <div className="mt-5 space-y-3">
                {rates.map((rate) => (
                  <label
                    key={rate.rate_id}
                    className={`flex cursor-pointer items-center gap-3 rounded-[var(--radius-card)] border p-4 transition-colors ${
                      rate.selected ? "border-flame bg-flame-soft" : "border-line hover:border-ink/25"
                    }`}
                  >
                    <input
                      type="radio"
                      name="shipping_rate"
                      checked={rate.selected}
                      onChange={() => chooseRate(rate.rate_id)}
                      className="accent-flame"
                    />
                    <span className="flex-1 text-sm">{decodeEntities(rate.name)}</span>
                    <span className="font-mono text-sm tabular-nums">
                      {Number(rate.price) === 0 ? "Free" : formatPrice(rate.price, rate)}
                    </span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="mt-5 rounded-[var(--radius-card)] border border-dashed border-line bg-mist p-5 text-sm leading-relaxed text-steel">
                {calculating
                  ? "Checking delivery options…"
                  : "Enter your postcode and state above to see delivery options."}
              </p>
            )}
          </section>
        )}

        {/* ------------------------------- payment ---------------------------- */}
        <section>
          <h2 className="font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-steel">
            Payment
          </h2>
          {paymentMethods.length > 0 ? (
            <div className="mt-5 space-y-3">
              {paymentMethods.map((method) => (
                <label
                  key={method.id}
                  className={`block cursor-pointer rounded-[var(--radius-card)] border p-4 transition-colors ${
                    payment === method.id ? "border-flame bg-flame-soft" : "border-line hover:border-ink/25"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="payment_method"
                      value={method.id}
                      checked={payment === method.id}
                      onChange={() => setPayment(method.id)}
                      className="accent-flame"
                    />
                    <span className="text-sm font-medium">{decodeEntities(method.title)}</span>
                  </span>
                  {method.description && (
                    <span
                      className="mt-2 block pl-7 text-sm leading-relaxed text-steel [&_p]:mb-1"
                      dangerouslySetInnerHTML={{ __html: method.description }}
                    />
                  )}
                </label>
              ))}
            </div>
          ) : (
            <p
              role="alert"
              className="mt-5 rounded-[var(--radius-card)] border border-flame bg-flame-soft p-5 text-sm leading-relaxed"
            >
              No payment method is available yet, so orders cannot be completed.{" "}
              <Link href="/quote" className="underline underline-offset-4">
                Request a quotation
              </Link>{" "}
              and we will invoice you directly.
            </p>
          )}
        </section>

        <section>
          <label htmlFor="note" className="mb-2 block text-sm font-medium">
            Order notes
          </label>
          <textarea
            id="note"
            name="note"
            rows={3}
            value={form.note}
            onChange={set("note")}
            placeholder="Delivery instructions, gate code, preferred time."
            className="w-full rounded-lg border border-line bg-paper px-4 py-3 text-sm"
          />
        </section>
      </div>

      {/* ------------------------------- summary ----------------------------- */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-[var(--radius-card)] border border-line bg-mist p-7">
          <h2 className="font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-steel">
            Your order
          </h2>

          <ul className="mt-5 space-y-3 border-b border-line pb-5">
            {cart.items.map((item) => (
              <li key={item.key} className="space-y-2">
                <div className="flex justify-between gap-4 text-sm">
                  <span className="min-w-0">{decodeEntities(item.name)}</span>
                  <span className="shrink-0 font-mono tabular-nums">
                    {formatPrice(item.totals.line_total, {
                      ...item.prices,
                      currency_minor_unit: item.totals.currency_minor_unit,
                    })}
                  </span>
                </div>
                <QuantityInput
                  size="sm"
                  value={item.quantity}
                  disabled={busy || placing}
                  label={decodeEntities(item.name)}
                  onChange={(quantity) => update(item.key, quantity)}
                />
              </li>
            ))}
          </ul>

          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-steel">Subtotal</dt>
              <dd className="font-mono tabular-nums">{formatPrice(money.total_items, money)}</dd>
            </div>
            {needsShipping && (
              <div className="flex justify-between">
                <dt className="text-steel">Delivery</dt>
                <dd className="font-mono tabular-nums">
                  {money.total_shipping !== null && money.total_shipping !== undefined
                    ? Number(money.total_shipping) === 0
                      ? "Free"
                      : formatPrice(money.total_shipping, money)
                    : "—"}
                </dd>
              </div>
            )}
            {Number(money.total_tax) > 0 && (
              <div className="flex justify-between">
                <dt className="text-steel">Tax</dt>
                <dd className="font-mono tabular-nums">{formatPrice(money.total_tax, money)}</dd>
              </div>
            )}
          </dl>

          <div className="hairline mt-5 flex items-baseline justify-between pt-5">
            <span className="font-semibold">Total</span>
            <span className="font-mono text-xl tabular-nums">
              {formatPrice(money.total_price, money)}
            </span>
          </div>

          {RECAPTCHA_SITE_KEY && (
            <div className="mt-6">
              <Recaptcha onChange={setCaptcha} resetSignal={captchaReset} />
            </div>
          )}

          {error && (
            <p
              role="alert"
              className="mt-5 rounded-lg border border-flame bg-flame-soft px-4 py-3 text-sm leading-relaxed"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={
              placing ||
              calculating ||
              paymentMethods.length === 0 ||
              (Boolean(RECAPTCHA_SITE_KEY) && !captcha)
            }
            className="mt-6 flex h-12 w-full items-center justify-center rounded-full bg-flame px-6 text-sm font-medium text-on-flame transition-colors hover:bg-flame-deep disabled:opacity-55"
          >
            {placing ? "Placing order…" : `Place order · ${formatPrice(money.total_price, money)}`}
          </button>

          <Link
            href="/cart"
            className="mt-3 block text-center text-sm text-steel underline underline-offset-4 hover:text-ink"
          >
            Back to cart
          </Link>
        </div>
      </aside>
    </form>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  required,
  hint,
  inputMode,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  required?: boolean;
  hint?: string;
  inputMode?: "numeric" | "text";
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-2 block text-sm font-medium">
        {label}
        {required && <span className="ml-1 text-flame">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        inputMode={inputMode}
        autoComplete={AUTOCOMPLETE[name] ?? "on"}
        className="h-12 w-full rounded-lg border border-line bg-paper px-4 text-sm"
      />
      {hint && <p className="mt-1.5 text-xs text-steel">{hint}</p>}
    </div>
  );
}

/** Browser autofill saves the customer a lot of typing on mobile. */
const AUTOCOMPLETE: Record<string, string> = {
  email: "email",
  phone: "tel",
  first_name: "given-name",
  last_name: "family-name",
  company: "organization",
  address_1: "address-line1",
  address_2: "address-line2",
  city: "address-level2",
  postcode: "postal-code",
};
