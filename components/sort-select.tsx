"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Select } from "./select";

export const SORT_OPTIONS = [
  { value: "", label: "Newest first" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "title", label: "Name: A to Z" },
] as const;

/** Sort control for the catalogue. The URL is the source of truth. */
export function SortSelect() {
  const router = useRouter();
  const params = useSearchParams();
  const current = params.get("sort") ?? "";

  function change(value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set("sort", value);
    else next.delete("sort");

    const query = next.toString();
    router.push(query ? `/products?${query}` : "/products", { scroll: false });
  }

  return (
    <Select
      value={current}
      onChange={change}
      options={SORT_OPTIONS}
      ariaLabel="Sort products"
      align="right"
      fullWidth={false}
      leadingIcon={
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M2 4h12M4 8h8M6 12h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      }
    />
  );
}
