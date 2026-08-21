import { NextResponse } from "next/server";
import { addItem, getCart, removeItem, updateItem } from "@/lib/cart-server";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await getCart();
  return NextResponse.json(result);
}

type Action =
  | { action: "add"; id: number; quantity?: number }
  | { action: "update"; key: string; quantity: number }
  | { action: "remove"; key: string };

export async function POST(request: Request) {
  let payload: Action;
  try {
    payload = (await request.json()) as Action;
  } catch {
    return NextResponse.json({ cart: null, error: "Malformed request." }, { status: 400 });
  }

  switch (payload.action) {
    case "add": {
      if (!Number.isInteger(payload.id)) {
        return NextResponse.json({ cart: null, error: "Missing product." }, { status: 400 });
      }
      return NextResponse.json(await addItem(payload.id, payload.quantity ?? 1));
    }
    case "update": {
      if (!payload.key) {
        return NextResponse.json({ cart: null, error: "Missing item." }, { status: 400 });
      }
      return NextResponse.json(await updateItem(payload.key, payload.quantity));
    }
    case "remove": {
      if (!payload.key) {
        return NextResponse.json({ cart: null, error: "Missing item." }, { status: 400 });
      }
      return NextResponse.json(await removeItem(payload.key));
    }
    default:
      return NextResponse.json({ cart: null, error: "Unknown action." }, { status: 400 });
  }
}
