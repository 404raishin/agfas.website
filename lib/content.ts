import { WP_URL } from "./wp";

/**
 * Storefront text, editable from WordPress under "AGFAS Content".
 *
 * These defaults are the source of truth until the bridge plugin is installed
 * — the site renders correctly either way, so a WordPress outage or a missing
 * plugin degrades to the original wording rather than to blank sections.
 */
export const CONTENT_DEFAULTS = {
  hero_eyebrow: "Gas detection · Malaysia",
  hero_line1: "You cannot smell",
  hero_line2: "a leak in time.",
  hero_accent: "A detector can.",
  hero_intro:
    "AGFAS builds gas leak detectors and fire safety equipment for Malaysian kitchens, homes and worksites — sized for LPG cylinders and piped natural gas alike.",
  hero_cta1_label: "Browse detectors",
  hero_cta1_href: "/products",
  hero_cta2_label: "Ask about a site survey",
  hero_cta2_href: "/contact",

  spec1_value: "20",
  spec1_unit: "%LEL",
  spec1_label: "Alarm threshold",
  spec2_value: "85",
  spec2_unit: "dB",
  spec2_label: "Siren at 1 metre",
  spec3_value: "24/7",
  spec3_unit: "",
  spec3_label: "Continuous sampling",
  spec4_value: "5",
  spec4_unit: "yr",
  spec4_label: "Sensor life",

  nav_products: "Products",
  nav_about: "Why AGFAS",
  nav_blog: "Safety notes",
  nav_contact: "Contact",

  shop_title: "Detectors and safety equipment",
  shop_lead:
    "Gas leak detectors, alarms and fire safety equipment, held in stock in Malaysia.",

  cat_eyebrow: "Catalogue",
  cat_title: "Detectors and safety equipment",
  cat_lead:
    "Every unit we stock is chosen for one thing: it has to alarm early enough that someone can act.",

  install_eyebrow: "Installation",
  install_title: "Three steps, then it looks after itself",
  install_lead:
    "A detector only works where the gas actually goes. Placement matters more than price.",
  step1_title: "Mount it where gas collects",
  step1_body:
    "LPG is heavier than air and pools at floor level; natural gas rises. We tell you which wall and what height for your gas type.",
  step2_title: "Power it and let it warm up",
  step2_body:
    "The sensor calibrates against clean room air for the first three minutes, then holds that baseline.",
  step3_title: "Test it every month",
  step3_body:
    "Press and hold to sound the siren. Thirty seconds a month is the whole maintenance routine.",

  cta_title: "Fitting out a kitchen, a factory or a whole building?",
  cta_body:
    "Tell us the gas type, the floor area and how many points you need covered. We will come back with a specification and a quote.",
  cta_label: "Request a quote",
  cta_href: "/quote",

  contact_email: "sales@agfasgas.com",
  quote_email: "sales@agfasgas.com",
  contact_phone: "",
  contact_whatsapp: "",
  contact_instagram: "",
  contact_youtube: "",
  contact_facebook: "",
  contact_tiktok: "",
  footer_tagline:
    "Gas leak detection and fire safety equipment for Malaysian homes, kitchens and worksites.",
};

export type SiteContent = typeof CONTENT_DEFAULTS;

/** Edits should show up quickly, so this is cached far more briefly than the catalogue. */
const CONTENT_REVALIDATE = 60;

export async function getSiteContent(): Promise<SiteContent> {
  try {
    const res = await fetch(`${WP_URL}/wp-json/agfas/v1/content`, {
      headers: { Accept: "application/json" },
      next: { revalidate: CONTENT_REVALIDATE, tags: ["content"] },
    });

    if (!res.ok) return CONTENT_DEFAULTS;

    const remote = (await res.json()) as Partial<SiteContent>;
    const merged = { ...CONTENT_DEFAULTS };

    // Only accept keys we know about, and never let a blank value blank the site.
    for (const key of Object.keys(CONTENT_DEFAULTS) as Array<keyof SiteContent>) {
      const value = remote[key];
      if (typeof value === "string" && value.trim() !== "") merged[key] = value;
    }
    return merged;
  } catch {
    return CONTENT_DEFAULTS;
  }
}
