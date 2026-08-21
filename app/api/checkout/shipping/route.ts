import { NextResponse } from "next/server";
import { selectShippingRate } from "@/lib/checkout-server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let payload: { rate_id?: string };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ cart: null, error: "Malformed request." }, { status: 400 });
  }
  if (!payload.rate_id) {
    return NextResponse.json({ cart: null, error: "Choose a delivery option." }, { status: 400 });
  }

  const result = await selectShippingRate(payload.rate_id);
  return NextResponse.json(result, { status: result.error ? 422 : 200 });
}
