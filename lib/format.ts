import type { WooPrices } from "./types";

type MinorUnitPrice = Pick<
  WooPrices,
  "currency_minor_unit" | "currency_prefix" | "currency_suffix" | "currency_decimal_separator" | "currency_thousand_separator"
>;

/**
 * Store API returns prices as integer strings in the currency's minor unit
 * (e.g. "12900" with minor_unit 2 is RM 129.00), plus the store's own
 * separators and affixes. Format with those rather than a hardcoded locale.
 */
export function formatPrice(amount: string | number | null | undefined, meta: Partial<MinorUnitPrice> = {}): string {
  if (amount === null || amount === undefined || amount === "") return "";

  const minorUnit = meta.currency_minor_unit ?? 2;
  const prefix = meta.currency_prefix ?? "RM";
  const suffix = meta.currency_suffix ?? "";
  const decimalSep = meta.currency_decimal_separator ?? ".";
  const thousandSep = meta.currency_thousand_separator ?? ",";

  const raw = Number(amount);
  if (!Number.isFinite(raw)) return "";

  const value = raw / 10 ** minorUnit;
  const [whole, fraction] = value.toFixed(minorUnit).split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, thousandSep);

  return `${prefix}${grouped}${fraction ? decimalSep + fraction : ""}${suffix}`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" });
}
