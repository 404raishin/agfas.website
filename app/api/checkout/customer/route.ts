import { NextResponse } from "next/server";
import { updateCustomer, type Address } from "@/lib/checkout-server";

export const dynamic = "force-dynamic";

/** Sets the delivery address on the cart so WooCommerce can price shipping. */
export async function POST(request: Request) {
  let payload: { billing_address?: Partial<Address>; shipping_address?: Partial<Address> };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ cart: null, error: "Malformed request." }, { status: 400 });
  }

  const result = await updateCustomer({
    billing_address: payload.billing_address,
    shipping_address: payload.shipping_address,
  });
  return NextResponse.json(result, { status: result.error ? 422 : 200 });
}
