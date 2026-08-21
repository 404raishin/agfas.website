import Link from "next/link";
import type { Metadata } from "next";
import { Section, SectionHead } from "@/components/section";

export const metadata: Metadata = {
  title: "Why AGFAS",
  description:
    "AGFAS supplies gas leak detectors and fire safety equipment across Malaysia, specified for LPG cylinders and piped natural gas.",
};

const PRINCIPLES = [
  {
    title: "Specified for the gas you use",
    body: "An LPG sensor and a natural gas sensor are not interchangeable, and mounting height differs because the gases behave differently. We match the unit to your supply before we quote.",
  },
  {
    title: "Alarms loud enough to wake a household",
    body: "A detector that chirps politely is decoration. Our units sound at 85 dB at one metre — the level that carries through a closed kitchen door at night.",
  },
  {
    title: "Stocked and supported locally",
    body: "Units ship from Malaysia, so replacement sensors and warranty claims do not wait on an overseas parcel.",
  },
];

export default function AboutPage() {
  return (
    <>
      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
          <p className="eyebrow">
            <span className="status-dot" />
            About
          </p>
          <h1 className="mt-6 max-w-3xl text-[2.5rem] sm:text-6xl">
            Gas safety is a threshold problem.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-steel">
            A leak is harmless until the concentration reaches the point where
            it can ignite. Everything AGFAS sells exists to put a warning
            between those two moments — and to make it loud.
          </p>
        </div>
      </section>

      <Section>
        <SectionHead
          eyebrow="How we work"
          title="Three things we will not compromise on"
        />
        <div className="mt-12 grid gap-px overflow-hidden rounded-[var(--radius-card)] border border-line bg-line md:grid-cols-3">
          {PRINCIPLES.map((p) => (
            <div key={p.title} className="bg-paper p-7">
              <h3 className="text-lg">{p.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-steel">{p.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section tone="mist">
        <div className="max-w-2xl">
          <h2 className="text-3xl sm:text-4xl">Talk to us about your site</h2>
          <p className="mt-4 text-base leading-relaxed text-steel">
            Restaurants, factories, hostels and homes all need different
            coverage. Send us the details and we will specify it properly.
          </p>
          <Link
            href="/contact"
            className="mt-8 inline-flex h-12 items-center rounded-full bg-solid px-7 text-sm font-medium text-on-solid transition-colors hover:bg-flame-deep"
          >
            Get in touch
          </Link>
        </div>
      </Section>
    </>
  );
}
