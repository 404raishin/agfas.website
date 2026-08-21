import { NextResponse } from "next/server";
import { WP_URL } from "@/lib/wp";
import { clientIpFrom, verifyRecaptcha } from "@/lib/recaptcha";

export const dynamic = "force-dynamic";

type QuoteItem = { name: string; quantity: number };

type QuotePayload = {
  kind?: "quote" | "contact";
  gas?: string;
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  message?: string;
  website?: string; // honeypot
  recaptchaToken?: string | null;
  items?: QuoteItem[];
};

/**
 * Quotation requests are relayed to WordPress, which sends the email with the
 * site's existing mail configuration. Keeping it server-side means the sales
 * address is never exposed to scrapers in the page source.
 */
export async function POST(request: Request) {
  let payload: QuotePayload;
  try {
    payload = (await request.json()) as QuotePayload;
  } catch {
    return NextResponse.json({ ok: false, error: "Malformed request." }, { status: 400 });
  }

  const check = await verifyRecaptcha(payload.recaptchaToken, clientIpFrom(request));
  if (!check.ok) {
    return NextResponse.json({ ok: false, error: check.error }, { status: 400 });
  }

  const name = payload.name?.trim() ?? "";
  const email = payload.email?.trim() ?? "";

  if (!name) {
    return NextResponse.json({ ok: false, error: "Please give your name." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { ok: false, error: "Please give a valid email address." },
      { status: 400 },
    );
  }

  try {
    const res = await fetch(`${WP_URL}/wp-json/agfas/v1/quote`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        kind: payload.kind === "contact" ? "contact" : "quote",
        gas: payload.gas?.trim() ?? "",
        name,
        email,
        phone: payload.phone?.trim() ?? "",
        company: payload.company?.trim() ?? "",
        message: payload.message?.trim() ?? "",
        website: payload.website ?? "",
        items: Array.isArray(payload.items) ? payload.items.slice(0, 50) : [],
      }),
      cache: "no-store",
    });

    const body = (await res.json().catch(() => null)) as { message?: string } | null;

    if (!res.ok) {
      // 404 means the WordPress bridge plugin is not installed yet.
      if (res.status === 404) {
        return NextResponse.json(
          {
            ok: false,
            error: "Quotation requests are not connected yet. Please email us directly.",
          },
          { status: 503 },
        );
      }
      return NextResponse.json(
        { ok: false, error: body?.message ?? "The request could not be sent." },
        { status: res.status },
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { ok: false, error: "We could not reach the server. Please email us directly." },
      { status: 502 },
    );
  }
}
