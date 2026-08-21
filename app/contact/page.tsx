import type { Metadata } from "next";
import Link from "next/link";
import { EnquiryForm } from "@/components/enquiry-form";
import { getSiteContent } from "@/lib/content";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact AGFAS about gas leak detectors, site surveys and bulk orders.",
};

export default async function ContactPage() {
  const t = await getSiteContent();

  const channels = [
    t.contact_email
      ? { label: "Email", value: t.contact_email, href: `mailto:${t.contact_email}` }
      : null,
    t.contact_phone
      ? { label: "Phone", value: t.contact_phone, href: `tel:${t.contact_phone.replace(/\s+/g, "")}` }
      : null,
    t.contact_whatsapp
      ? { label: "WhatsApp", value: "Message us", href: t.contact_whatsapp }
      : null,
  ].filter((c): c is { label: string; value: string; href: string } => c !== null);

  return (
    <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
      <p className="eyebrow">
        <span className="status-dot" />
        Contact
      </p>
      <h1 className="mt-4 text-4xl sm:text-5xl">Tell us what you need covered</h1>
      <p className="mt-5 max-w-xl text-base leading-relaxed text-steel sm:text-lg">
        Include your gas type, the rough floor area and how many detection
        points you are planning for. That is enough for us to come back with a
        specification.
      </p>

      <div className="mt-14 grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
        <EnquiryForm kind="contact" salesEmail={t.contact_email} />

        <aside className="rounded-[var(--radius-card)] border border-line bg-mist p-7 lg:self-start">
          <h2 className="font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-steel">
            Reach us directly
          </h2>
          <dl className="mt-5 space-y-4">
            {channels.map((c) => (
              <div key={c.label}>
                <dt className="text-sm text-steel">{c.label}</dt>
                <dd className="mt-0.5">
                  <a
                    href={c.href}
                    className="text-sm text-ink underline underline-offset-4 hover:text-flame-deep"
                  >
                    {c.value}
                  </a>
                </dd>
              </div>
            ))}
          </dl>

          <p className="mt-6 text-sm leading-relaxed text-steel">
            Need pricing for several units or a whole site?{" "}
            <Link href="/quote" className="text-flame-deep underline underline-offset-4">
              Request a quotation
            </Link>
            .
          </p>

          <p className="hairline mt-6 pt-5 text-sm leading-relaxed text-steel">
            Smell gas right now? Do not switch anything on or off. Turn the
            cylinder valve off if it is safe to reach, open the windows, and
            leave the building before calling.
          </p>
        </aside>
      </div>
    </div>
  );
}
