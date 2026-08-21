/**
 * Seeds the AGFAS catalogue into WooCommerce over the REST API.
 *
 * Requires WooCommerce API keys with Read/Write access, set in .env.local:
 *   WC_CONSUMER_KEY=ck_...
 *   WC_CONSUMER_SECRET=cs_...
 *
 * Generate them in WordPress:
 *   WooCommerce > Settings > Advanced > REST API > Add key
 *
 * Run:  npm run seed          (create or update)
 *       npm run seed -- --dry (show what would change, write nothing)
 *
 * Idempotent: products are matched on SKU, so re-running updates the existing
 * product instead of creating a duplicate.
 */

import { readFileSync } from "node:fs";
import { CATEGORIES, PRODUCTS } from "./catalog.mjs";

const DRY = process.argv.includes("--dry");

/* ------------------------------- env ---------------------------------- */

function loadEnv() {
  const env = { ...process.env };
  try {
    const raw = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    for (const line of raw.split("\n")) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!match) continue;
      const value = match[2].replace(/^["']|["']$/g, "");
      if (value) env[match[1]] ??= value;
    }
  } catch {
    // .env.local is optional if the values are already exported.
  }
  return env;
}

const env = loadEnv();
const WP_URL = (env.WP_URL ?? "https://wp.agfasgas.com").replace(/\/$/, "");
const KEY = env.WC_CONSUMER_KEY;
const SECRET = env.WC_CONSUMER_SECRET;

if (!KEY || !SECRET) {
  console.error(
    "\nMissing WooCommerce API keys.\n\n" +
      "  1. In WordPress go to: WooCommerce > Settings > Advanced > REST API\n" +
      '  2. Add key, set Permissions to "Read/Write", and generate\n' +
      "  3. Put the two values in .env.local:\n\n" +
      "       WC_CONSUMER_KEY=ck_xxxxxxxx\n" +
      "       WC_CONSUMER_SECRET=cs_xxxxxxxx\n\n" +
      "  4. Run this again: npm run seed\n",
  );
  process.exit(1);
}

const AUTH = "Basic " + Buffer.from(`${KEY}:${SECRET}`).toString("base64");

/* ------------------------------- client -------------------------------- */

async function wc(path, { method = "GET", body } = {}) {
  const res = await fetch(`${WP_URL}/wp-json/wc/v3${path}`, {
    method,
    headers: {
      Authorization: AUTH,
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data = null;
  try {
    data = JSON.parse(text);
  } catch {
    /* non-JSON error page */
  }

  if (!res.ok) {
    const message = data?.message ?? text.slice(0, 200);
    throw new Error(`${method} ${path} → ${res.status}: ${message}`);
  }
  return data;
}

/* ----------------------------- categories ------------------------------ */

async function ensureCategories() {
  const existing = await wc("/products/categories?per_page=100");
  const bySlug = new Map(existing.map((c) => [c.slug, c]));
  const ids = {};

  for (const cat of CATEGORIES) {
    const found = bySlug.get(cat.slug);
    if (found) {
      ids[cat.slug] = found.id;
      console.log(`  = category ${cat.name} (#${found.id})`);
      continue;
    }
    if (DRY) {
      console.log(`  + category ${cat.name} (would create)`);
      ids[cat.slug] = -1;
      continue;
    }
    const created = await wc("/products/categories", { method: "POST", body: cat });
    ids[cat.slug] = created.id;
    console.log(`  + category ${cat.name} (#${created.id})`);
  }
  return ids;
}

/* ------------------------------ products ------------------------------- */

function toPayload(product, categoryIds) {
  const { sku, name, regular_price, sale_price, category, short_description, description, attributes, stock } =
    product;

  return {
    name,
    sku,
    type: "simple",
    status: "publish",
    catalog_visibility: "visible",
    regular_price,
    ...(sale_price ? { sale_price } : {}),
    description,
    short_description,
    categories: categoryIds[category] > 0 ? [{ id: categoryIds[category] }] : [],
    manage_stock: true,
    stock_quantity: stock,
    stock_status: stock > 0 ? "instock" : "outofstock",
    attributes: attributes.map((attr, i) => ({ ...attr, position: i, variation: false })),
  };
}

async function seedProducts(categoryIds) {
  for (const product of PRODUCTS) {
    const matches = await wc(`/products?sku=${encodeURIComponent(product.sku)}`);
    const existing = matches?.[0];
    const payload = toPayload(product, categoryIds);

    if (DRY) {
      console.log(`  ${existing ? "~" : "+"} ${product.sku}  ${product.name} (would ${existing ? "update" : "create"})`);
      continue;
    }

    if (existing) {
      await wc(`/products/${existing.id}`, { method: "PUT", body: payload });
      console.log(`  ~ ${product.sku}  ${product.name} (updated #${existing.id})`);
    } else {
      const created = await wc("/products", { method: "POST", body: payload });
      console.log(`  + ${product.sku}  ${product.name} (created #${created.id})`);
    }
  }
}

/* -------------------------------- run ---------------------------------- */

async function main() {
  console.log(`\nSeeding ${WP_URL}${DRY ? "  [dry run — nothing will be written]" : ""}\n`);

  console.log("Categories");
  const categoryIds = await ensureCategories();

  console.log("\nProducts");
  await seedProducts(categoryIds);

  console.log(
    DRY
      ? "\nDry run complete. Re-run without --dry to apply.\n"
      : "\nDone. Products are live — the Next.js catalogue picks them up within 10 minutes,\n" +
          "or immediately if you restart the dev server.\n\n" +
          "Next: add product photos in WooCommerce. Every product page already has a\n" +
          "gallery ready for them.\n",
  );
}

main().catch((err) => {
  console.error(`\nSeeding failed: ${err.message}\n`);
  if (String(err.message).includes("401") || String(err.message).includes("403")) {
    console.error(
      "That looks like an auth problem. Check the key has Read/Write permission,\n" +
        "and that it was copied complete (ck_… and cs_… are long).\n",
    );
  }
  process.exit(1);
});
