"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "./cart-provider";
import { Recaptcha, RECAPTCHA_SITE_KEY } from "./recaptcha";
import { Select } from "./select";
import { decodeEntities } from "@/lib/wp";
import { QuantityInput } from "./quantity-input";

type Status = "idle" | "sending" | "sent" | "error";

const GAS_TYPES = [
  { value: "LPG (cylinder)", label: "LPG (cylinder)" },
  { value: "Natural gas (piped)", label: "Natural gas (piped)" },
  { value: "Both", label: "Both" },
  { value: "Not sure", label: "Not sure" },
] as const;

/**
 * Shared by the quotation and contact pages. Both relay through
 * `/api/quote` → WordPress → `wp_mail`, so the sales address never appears in
 * the page source and there is one code path to keep working.
 *
 * A `mailto:` form was the previous approach; browsers either block those or
 * produce a mangled draft, so enquiries were being lost silently.
 */
const COPY = {
  quote: {
    submit: "Send quotation request",
    sending: "Sending…",
    sentTitle: "We have your request",
    sentBody:
      "We will reply with a specification and pricing, usually within one working day. Check your spam folder if nothing arrives.",
    messageLabel: "What do you need covered?",
    messagePlaceholder:
      "e.g. A 120 m² restaurant kitchen with four LPG cylinders, plus two detectors for the store room.",
    attachCart: true,
  },
  contact: {
    submit: "Send enquiry",
    sending: "Sending…",
    sentTitle: "Thanks — message received",
    sentBody:
      "We will get back to you, usually within one working day. Check your spam folder if nothing arrives.",
    messageLabel: "What are you protecting?",
    messagePlaceholder: "e.g. A 120 m² restaurant kitchen with four LPG cylinders.",
    attachCart: false,
  },
} as const;

export function EnquiryForm({
  kind = "quote",
  salesEmail,
}: {
  kind?: "quote" | "contact";
  salesEmail: string;
}) {
  const { cart, update, remove, busy } = useCart();
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [captcha, setCaptcha] = useState<string | null>(null);
  const [captchaReset, setCaptchaReset] = useState(0);
  const [gas, setGas] = useState<string>(GAS_TYPES[0].value);
  const copy = COPY[kind];

  const lines = copy.attachCart ? (cart?.items ?? []) : [];
  const items = lines.map((i) => ({ name: decodeEntities(i.name), quantity: i.quantity }));

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    setStatus("sending");
    setError(null);

    try {
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          name: data.get("name"),
          email: data.get("email"),
          phone: data.get("phone"),
          company: data.get("company"),
          gas: data.get("gas"),
          message: data.get("message"),
          website: data.get("website"),
          recaptchaToken: captcha,
          items,
        }),
      });
      const body = (await res.json()) as { ok: boolean; error?: string };

      if (!res.ok || !body.ok) {
        setStatus("error");
        setError(body.error ?? "The message could not be sent.");
        setCaptcha(null);
        setCaptchaReset((n) => n + 1);
        return;
      }
      setStatus("sent");
      form.reset();
    } catch {
      setStatus("error");
      setError("We could not reach the server. Please email us directly.");
    }
  }

  if (status === "sent") {
    return (
      <div className="rounded-[var(--radius-card)] border border-line bg-mist p-10 text-center">
        <p className="font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-safe">Sent</p>
        <h2 className="mt-4 text-2xl">{copy.sentTitle}</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-steel">{copy.sentBody}</p>
        <Link
          href="/products"
          className="mt-7 inline-flex h-11 items-center rounded-full bg-solid px-6 text-sm font-medium text-on-solid transition-colors hover:bg-flame-deep hover:text-on-flame"
        >
          Back to the catalogue
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {lines.length > 0 && (
        <div className="rounded-[var(--radius-card)] border border-line bg-mist p-5">
          <p className="font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-steel">
            Included from your cart
          </p>
          <ul className="mt-4 space-y-3">
            {lines.map((line) => (
              <li key={line.key} className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <span className="min-w-0 flex-1 text-sm">{decodeEntities(line.name)}</span>

                <QuantityInput
                  size="sm"
                  value={line.quantity}
                  disabled={busy}
                  label={decodeEntities(line.name)}
                  onChange={(quantity) => update(line.key, quantity)}
                />

                <button
                  type="button"
                  disabled={busy}
                  onClick={() => remove(line.key)}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-steel transition-colors hover:bg-flame-soft hover:text-flame-deep disabled:opacity-50"
                  aria-label={`Remove ${decodeEntities(line.name)} from this request`}
                >
                  <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden="true">
                    <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs leading-relaxed text-steel">
            Changes here update your cart too.
          </p>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Name" name="name" required />
        <Field label="Company" name="company" />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Email" name="email" type="email" required />
        <Field label="Phone" name="phone" type="tel" />
      </div>

      <div>
        <span id="gas-label" className="mb-2 block text-sm font-medium">
          Gas type
        </span>
        <Select
          name="gas"
          labelledBy="gas-label"
          value={gas}
          onChange={setGas}
          options={GAS_TYPES}
        />
      </div>

      <div>
        <label htmlFor="message" className="mb-2 block text-sm font-medium">
          {copy.messageLabel}
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          placeholder={copy.messagePlaceholder}
          className="w-full rounded-lg border border-line bg-paper px-4 py-3 text-sm"
        />
      </div>

      {/* Honeypot — hidden from people, irresistible to bots. */}
      <div aria-hidden="true" className="absolute left-[-9999px]">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <Recaptcha onChange={setCaptcha} resetSignal={captchaReset} />

      {error && (
        <p role="alert" className="rounded-lg border border-flame bg-flame-soft px-4 py-3 text-sm">
          {error}{" "}
          <a href={`mailto:${salesEmail}`} className="underline underline-offset-2">
            {salesEmail}
          </a>
        </p>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={status === "sending" || (Boolean(RECAPTCHA_SITE_KEY) && !captcha)}
          className="h-12 rounded-full bg-flame px-8 text-sm font-medium text-on-flame transition-colors hover:bg-flame-deep disabled:opacity-55"
        >
          {status === "sending" ? copy.sending : copy.submit}
        </button>
        <a
          href={`mailto:${salesEmail}`}
          className="text-sm text-steel underline underline-offset-4 hover:text-ink"
        >
          or email {salesEmail}
        </a>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
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
        required={required}
        className="h-12 w-full rounded-lg border border-line bg-paper px-4 text-sm"
      />
    </div>
  );
}
