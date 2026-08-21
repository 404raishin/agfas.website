import type { Metadata } from "next";
import { EnquiryForm } from "@/components/enquiry-form";
import { getSiteContent } from "@/lib/content";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Request a quotation",
  description:
    "Ask AGFAS for a quotation on gas leak detectors and fire safety equipment. Bulk, commercial and multi-point installations welcome.",
};

const REASONS = [
  "Bulk or trade pricing",
  "Multi-point or multi-zone installations",
  "Supply with installation by a registered fitter",
  "Purchase orders and company invoicing",
];

export default async function QuotePage() {
  const t = await getSiteContent();

  return (
    <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
      <p className="eyebrow">
        <span className="status-dot" />
        Quotation
      </p>
      <h1 className="mt-4 text-4xl sm:text-5xl">Ask for a quotation</h1>
      <p className="mt-5 max-w-xl text-base leading-relaxed text-steel sm:text-lg">
        Anything in your cart is attached automatically. Add whatever else you
        need and we will price it as one job.
      </p>

      <div className="mt-14 grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
        <EnquiryForm kind="quote" salesEmail={t.contact_email} />

        <aside className="rounded-[var(--radius-card)] border border-line bg-mist p-7 lg:self-start">
          <h2 className="font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-steel">
            Quote instead of checkout when you need
          </h2>
          <ul className="mt-5 space-y-3">
            {REASONS.map((reason) => (
              <li key={reason} className="flex gap-3 text-sm leading-relaxed">
                <span
                  aria-hidden="true"
                  className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-flame"
                />
                {reason}
              </li>
            ))}
          </ul>
          <p className="hairline mt-6 pt-5 text-sm leading-relaxed text-steel">
            Buying one or two units at list price? Checking out directly from
            the cart is faster.
          </p>
        </aside>
      </div>
    </div>
  );
}
