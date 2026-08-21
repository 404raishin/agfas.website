import Link from "next/link";
import type { Metadata } from "next";
import { Section, SectionHead } from "@/components/section";
import { getSiteContent } from "@/lib/content";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "About",
  description:
    "AGFAS has been established in Malaysia and Singapore since 2018, specialising in gas detector systems and gas leak detection products.",
};

export default async function AboutPage() {
  const t = await getSiteContent();

  const facts = [
    { value: t.about_stat1_value, unit: "", label: t.about_stat1_label },
    { value: t.about_stat2_value, unit: "", label: t.about_stat2_label },
    { value: t.about_stat3_value, unit: t.about_stat3_unit, label: t.about_stat3_label },
  ];

  const values = [
    { title: t.about_p1_title, body: t.about_p1_body },
    { title: t.about_p2_title, body: t.about_p2_body },
    { title: t.about_p3_title, body: t.about_p3_body },
  ];

  return (
    <>
      {/* ------------------------------ intro ------------------------------- */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
          <p className="eyebrow">
            <span className="status-dot" />
            {t.about_eyebrow}
          </p>
          <h1 className="mt-6 max-w-3xl text-[2.5rem] sm:text-6xl">{t.about_title}</h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-steel">{t.about_intro}</p>
        </div>

        {/* The facts a buyer weighs a supplier on, in the same instrument
            treatment as the specs on the home page. */}
        <div className="border-t border-line bg-mist">
          <dl className="mx-auto grid max-w-6xl grid-cols-1 gap-px bg-line px-5 sm:grid-cols-3 sm:px-8">
            {facts.map((fact) => (
              <div
                key={fact.label}
                className="flex flex-col-reverse bg-mist px-1 py-6 lg:px-4"
              >
                <dt className="mt-1 text-sm text-steel">{fact.label}</dt>
                <dd>
                  <span className="font-mono text-2xl tabular-nums">{fact.value}</span>
                  {fact.unit && <span className="font-mono text-sm text-steel">{fact.unit}</span>}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ------------------------------ story ------------------------------- */}
      <Section>
        <div className="grid gap-10 lg:grid-cols-[1fr_1.3fr] lg:gap-16">
          <h2 className="text-3xl sm:text-4xl">{t.about_story_title}</h2>
          <div className="space-y-5 text-base leading-relaxed text-steel sm:text-lg">
            <p>{t.about_story_body}</p>
            <p>{t.about_story_body2}</p>
          </div>
        </div>
      </Section>

      {/* ------------------------------ values ------------------------------ */}
      <Section tone="mist">
        <SectionHead eyebrow="How we work" title={t.about_values_title} />
        <div className="mt-12 grid gap-px overflow-hidden rounded-[var(--radius-card)] border border-line bg-line md:grid-cols-3">
          {values.map((value) => (
            <div key={value.title} className="bg-paper p-7">
              <h3 className="text-lg">{value.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-steel">{value.body}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ------------------------------- cta -------------------------------- */}
      <Section>
        <div className="rounded-[var(--radius-card)] border border-line bg-mist px-8 py-14 text-center sm:px-14">
          <h2 className="mx-auto max-w-xl text-3xl sm:text-4xl">{t.about_cta_title}</h2>
          <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-steel">
            {t.about_cta_body}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href={t.about_cta_href}
              className="inline-flex h-12 items-center rounded-full bg-flame px-8 text-sm font-medium text-on-flame transition-colors hover:bg-flame-deep"
            >
              {t.about_cta_label}
            </Link>
            <Link
              href="/products"
              className="inline-flex h-12 items-center rounded-full border border-line bg-paper px-7 text-sm font-medium transition-colors hover:border-ink/25"
            >
              See the range
            </Link>
          </div>
        </div>
      </Section>
    </>
  );
}
