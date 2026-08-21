import Link from "next/link";
import { LelMeter } from "@/components/lel-meter";
import { ProductCard } from "@/components/product-card";
import { Section, SectionHead } from "@/components/section";
import { getSiteContent } from "@/lib/content";
import { decodeEntities, getProductCategories, getProducts } from "@/lib/wp";

export const revalidate = 60;

export default async function Home() {
  const [featured, categories, t] = await Promise.all([
    getProducts({ category: "gas-leak-detectors", perPage: 3 }),
    getProductCategories(),
    getSiteContent(),
  ]);

  // Specs a buyer actually compares detectors on.
  const specs = [
    { value: t.spec1_value, unit: t.spec1_unit, label: t.spec1_label },
    { value: t.spec2_value, unit: t.spec2_unit, label: t.spec2_label },
    { value: t.spec3_value, unit: t.spec3_unit, label: t.spec3_label },
    { value: t.spec4_value, unit: t.spec4_unit, label: t.spec4_label },
  ];

  // An installation is a real sequence, so it is numbered. Nothing else is.
  const steps = [
    { title: t.step1_title, body: t.step1_body },
    { title: t.step2_title, body: t.step2_body },
    { title: t.step3_title, body: t.step3_body },
  ];

  return (
    <>
      {/* ------------------------------ hero ------------------------------ */}
      <section className="border-b border-line">
        <div className="mx-auto grid max-w-6xl gap-14 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-20">
          <div>
            <p className="eyebrow">
              <span className="status-dot" />
              {t.hero_eyebrow}
            </p>

            <h1 className="mt-6 text-[2.75rem] sm:text-6xl lg:text-[4.25rem]">
              {t.hero_line1}
              <br />
              {t.hero_line2}
              <br />
              <span className="text-flame">{t.hero_accent}</span>
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-relaxed text-steel">{t.hero_intro}</p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href={t.hero_cta1_href}
                className="inline-flex h-12 items-center rounded-full bg-solid px-7 text-sm font-medium text-on-solid transition-colors hover:bg-flame-deep"
              >
                {t.hero_cta1_label}
              </Link>
              <Link
                href={t.hero_cta2_href}
                className="inline-flex h-12 items-center rounded-full border border-line px-7 text-sm font-medium transition-colors hover:border-ink/25 hover:bg-mist"
              >
                {t.hero_cta2_label}
              </Link>
            </div>
          </div>

          <LelMeter />
        </div>

        {/* Spec strip: the numbers a buyer compares across brands. */}
        <div className="border-t border-line bg-mist">
          <dl className="mx-auto grid max-w-6xl grid-cols-2 gap-px bg-line px-5 sm:px-8 lg:grid-cols-4">
            {specs.map((spec) => (
              <div
                key={spec.label}
                className="flex flex-col-reverse bg-mist px-1 py-6 lg:px-4"
              >
                <dt className="mt-1 text-sm text-steel">{spec.label}</dt>
                <dd>
                  <span className="font-mono text-2xl tabular-nums">{spec.value}</span>
                  <span className="font-mono text-sm text-steel">{spec.unit}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ---------------------------- catalogue --------------------------- */}
      <Section>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHead eyebrow={t.cat_eyebrow} title={t.cat_title} lead={t.cat_lead} />
          <Link
            href="/products"
            className="text-sm font-medium text-flame-deep underline underline-offset-4"
          >
            View all products
          </Link>
        </div>

        {featured.length > 0 ? (
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="mt-12 rounded-[var(--radius-card)] border border-dashed border-line bg-mist p-10 text-center">
            <p className="font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-steel">
              Catalogue loading
            </p>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-steel">
              Products added in WooCommerce appear here automatically.
            </p>
          </div>
        )}

        {categories.length > 0 && (
          <div className="mt-10 flex flex-wrap gap-2">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/products?category=${cat.slug}`}
                className="rounded-full border border-line px-4 py-2 text-sm transition-colors hover:border-flame hover:bg-flame-soft"
              >
                {decodeEntities(cat.name)}
                <span className="ml-2 font-mono text-xs text-steel">{cat.count}</span>
              </Link>
            ))}
          </div>
        )}
      </Section>

      {/* --------------------------- installation ------------------------- */}
      <Section tone="mist">
        <SectionHead
          eyebrow={t.install_eyebrow}
          title={t.install_title}
          lead={t.install_lead}
        />

        <ol className="mt-12 grid gap-px overflow-hidden rounded-[var(--radius-card)] border border-line bg-line md:grid-cols-3">
          {steps.map((step, i) => (
            <li key={step.title} className="bg-paper p-7">
              <span className="font-mono text-sm text-flame">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-3 text-lg">{step.title}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-steel">{step.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* ------------------------------- cta ------------------------------ */}
      <Section>
        {/* Same quiet panel treatment as the rest of the page: a neutral ground
            and a hairline. Orange stays an accent on the button, not a wash. */}
        <div className="rounded-[var(--radius-card)] border border-line bg-mist px-8 py-14 text-center sm:px-14">
          <h2 className="mx-auto max-w-xl text-3xl sm:text-4xl">{t.cta_title}</h2>
          <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-steel">
            {t.cta_body}
          </p>
          <Link
            href={t.cta_href}
            className="mt-8 inline-flex h-12 items-center rounded-full bg-flame px-8 text-sm font-medium text-on-flame transition-colors hover:bg-flame-deep"
          >
            {t.cta_label}
          </Link>
        </div>
      </Section>
    </>
  );
}
