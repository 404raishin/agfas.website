import { NextResponse } from "next/server";
import { placeOrder, type Address } from "@/lib/checkout-server";
import { clientIpFrom, verifyRecaptcha } from "@/lib/recaptcha";

export const dynamic = "force-dynamic";

const REQUIRED: Array<keyof Address> = [
  "first_name",
  "last_name",
  "address_1",
  "city",
  "state",
  "postcode",
  "country",
];

type Payload = {
  billing_address?: Address;
  shipping_address?: Address;
  payment_method?: string;
  customer_note?: string;
  recaptchaToken?: string | null;
};

export async function POST(request: Request) {
  let payload: Payload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Malformed request." }, { status: 400 });
  }

  const check = await verifyRecaptcha(payload.recaptchaToken, clientIpFrom(request));
  if (!check.ok) {
    return NextResponse.json({ ok: false, error: check.error }, { status: 400 });
  }

  const billing = payload.billing_address;
  const shipping = payload.shipping_address ?? billing;

  if (!billing || !shipping) {
    return NextResponse.json({ ok: false, error: "Enter a delivery address." }, { status: 400 });
  }

  const missing = REQUIRED.filter((field) => !String(billing[field] ?? "").trim());
  if (missing.length) {
    return NextResponse.json(
      { ok: false, error: "Please complete every required field." },
      { status: 400 },
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(billing.email ?? ""))) {
    return NextResponse.json(
      { ok: false, error: "Enter a valid email address for the order confirmation." },
      { status: 400 },
    );
  }

  if (!payload.payment_method) {
    return NextResponse.json({ ok: false, error: "Choose a payment method." }, { status: 400 });
  }

  const result = await placeOrder({
    billing_address: billing,
    shipping_address: shipping,
    payment_method: payload.payment_method,
    customer_note: payload.customer_note,
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 422 });
}
