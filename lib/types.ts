/** Shapes returned by the WooCommerce Store API (`wc/store/v1`). */

export type WooPrices = {
  price: string;
  regular_price: string;
  sale_price: string;
  currency_code: string;
  currency_symbol: string;
  currency_minor_unit: number;
  currency_decimal_separator: string;
  currency_thousand_separator: string;
  currency_prefix: string;
  currency_suffix: string;
};

export type WooImage = {
  id: number;
  src: string;
  thumbnail: string;
  alt: string;
  name?: string;
};

export type WooTerm = { id: number; name: string; slug: string; link?: string };

export type WooAttribute = {
  id: number;
  name: string;
  taxonomy: string | null;
  has_variations: boolean;
  terms: WooTerm[];
};

export type WooProduct = {
  id: number;
  name: string;
  slug: string;
  permalink: string;
  short_description: string;
  description: string;
  sku: string;
  type: string;
  on_sale: boolean;
  prices: WooPrices;
  average_rating: string;
  review_count: number;
  images: WooImage[];
  categories: WooTerm[];
  tags: WooTerm[];
  attributes: WooAttribute[];
  is_in_stock: boolean;
  is_purchasable: boolean;
  is_on_backorder?: boolean;
  /** WooCommerce's own wording, e.g. "6 in stock". Honours the store's display settings. */
  stock_availability?: { text: string; class: string } | null;
  /** Set only once stock drops under the store's low-stock threshold. */
  low_stock_remaining?: number | null;
  add_to_cart?: { text: string; description: string };
};

export type WooCategory = {
  id: number;
  name: string;
  slug: string;
  description: string;
  count: number;
  image: WooImage | null;
};

export type WooCartItem = {
  key: string;
  id: number;
  name: string;
  short_description: string;
  permalink: string;
  quantity: number;
  images: WooImage[];
  prices: WooPrices & { raw_prices?: unknown };
  totals: { line_total: string; line_subtotal: string; currency_minor_unit: number } & Partial<WooPrices>;
};

export type WooShippingRate = {
  rate_id: string;
  name: string;
  description: string;
  price: string;
  selected: boolean;
  currency_minor_unit: number;
  currency_prefix: string;
  currency_suffix: string;
  currency_decimal_separator: string;
  currency_thousand_separator: string;
};

export type WooShippingPackage = {
  package_id: number;
  name: string;
  shipping_rates: WooShippingRate[];
};

export type WooCart = {
  items: WooCartItem[];
  shipping_rates?: WooShippingPackage[];
  has_calculated_shipping?: boolean;
  items_count: number;
  items_weight: number;
  needs_payment: boolean;
  needs_shipping: boolean;
  totals: {
    total_items: string;
    total_price: string;
    total_shipping?: string | null;
    total_tax: string;
    currency_code: string;
    currency_symbol: string;
    currency_minor_unit: number;
    currency_prefix: string;
    currency_suffix: string;
  };
  errors?: unknown[];
};

/** Shapes returned by the WordPress REST API (`wp/v2`). */
export type WpRendered = { rendered: string };

export type WpPost = {
  id: number;
  slug: string;
  date: string;
  modified: string;
  title: WpRendered;
  excerpt: WpRendered;
  content: WpRendered;
  featured_media: number;
  _embedded?: {
    "wp:featuredmedia"?: Array<{ source_url: string; alt_text: string }>;
    author?: Array<{ name: string }>;
  };
};

export type WpPage = {
  id: number;
  slug: string;
  title: WpRendered;
  content: WpRendered;
};
