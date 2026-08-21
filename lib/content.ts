import { WP_URL } from "./wp";

/**
 * Storefront text, editable from WordPress under "AGFAS Content".
 *
 * These defaults are the source of truth until the bridge plugin is installed
 * — the site renders correctly either way, so a WordPress outage or a missing
 * plugin degrades to the original wording rather than to blank sections.
 */
export const CONTENT_DEFAULTS = {
  /** "no" switches checkout off site-wide; anything else leaves it on. */
  checkout_enabled: "yes",
  checkout_message:
    "Our payment system is currently unavailable. Please request a quotation instead and we will invoice you directly.",

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
  nav_about: "About",
  nav_blog: "Safety notes",
  nav_contact: "Contact",

  about_eyebrow: "About AGFAS",
  about_title: "Gas detection is the whole business.",
  about_intro:
    "AGFAS has been established in Malaysia and Singapore since 2018, specialising in gas detector systems. Over the years we have developed a wide range of gas leak detector products built for reliability.",

  about_stat1_value: "2018",
  about_stat1_label: "Established",
  about_stat2_value: "MY · SG",
  about_stat2_label: "Malaysia and Singapore",
  about_stat3_value: "20",
  about_stat3_unit: "%LEL",
  about_stat3_label: "Where every unit alarms",

  about_story_title: "What we build",
  about_story_body:
    "Our range covers the two supplies Malaysian and Singaporean buildings actually run on: LPG from cylinders, and piped natural gas. That split matters more than it sounds — the two gases collect at opposite ends of a room, so a detector specified for one will not protect against the other.",
  about_story_body2:
    "From a single plug-in unit for a home kitchen through to multi-zone panels for commercial sites, everything we sell is chosen or built around one requirement: it has to alarm early enough that someone still has time to act.",

  about_values_title: "Three things we will not compromise on",
  about_p1_title: "Specified for the gas you use",
  about_p1_body:
    "An LPG sensor and a natural gas sensor are not interchangeable, and mounting height differs because the gases behave differently. We match the unit to your supply before we quote.",
  about_p2_title: "Alarms loud enough to wake a household",
  about_p2_body:
    "A detector that chirps politely is decoration. Our units sound at 85 dB at one metre — the level that carries through a closed kitchen door at night.",
  about_p3_title: "Stocked and supported locally",
  about_p3_body:
    "Units ship from within the region, so replacement sensors and warranty claims do not wait on an overseas parcel.",

  about_cta_title: "Talk to us about your site",
  about_cta_body:
    "Restaurants, factories, hostels and homes all need different coverage. Send us the details and we will specify it properly.",
  about_cta_label: "Get in touch",
  about_cta_href: "/contact",

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

/**
 * Checkout is on unless explicitly switched off, so a WordPress outage or a
 * missing field can never take the shop down by accident — it fails open.
 */
export function checkoutEnabled(content: SiteContent): boolean {
  return content.checkout_enabled !== "no";
}

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
