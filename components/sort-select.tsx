"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export const SORT_OPTIONS = [
  { value: "", label: "Newest first" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "title", label: "Name: A to Z" },
] as const;

/**
 * Sort control.
 *
 * A native `<select>` was the obvious choice, but its option list is drawn by
 * the operating system — it cannot take the site's colours, radius or type, so
 * it renders as a white menu over the dark theme. This is a listbox instead,
 * built to the ARIA pattern so keyboard and screen-reader behaviour matches
 * what the native control would have given.
 */
export function SortSelect() {
  const router = useRouter();
  const params = useSearchParams();

  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);

  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();

  const current = params.get("sort") ?? "";
  const selectedIndex = Math.max(
    0,
    SORT_OPTIONS.findIndex((o) => o.value === current),
  );
  const selected = SORT_OPTIONS[selectedIndex];

  function choose(value: string) {
    setOpen(false);
    buttonRef.current?.focus();

    const next = new URLSearchParams(params.toString());
    if (value) next.set("sort", value);
    else next.delete("sort");
    const query = next.toString();
    router.push(query ? `/products?${query}` : "/products", { scroll: false });
  }

  // Open with the current choice under the cursor.
  function openList(startAt = selectedIndex) {
    setHighlight(startAt);
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  // Move focus onto the list so screen readers follow the highlighted option.
  useEffect(() => {
    if (open) listRef.current?.focus();
  }, [open]);

  function onListKeyDown(e: React.KeyboardEvent) {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlight((i) => (i + 1) % SORT_OPTIONS.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlight((i) => (i - 1 + SORT_OPTIONS.length) % SORT_OPTIONS.length);
        break;
      case "Home":
        e.preventDefault();
        setHighlight(0);
        break;
      case "End":
        e.preventDefault();
        setHighlight(SORT_OPTIONS.length - 1);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        choose(SORT_OPTIONS[highlight].value);
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        buttonRef.current?.focus();
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  }

  return (
    <div ref={rootRef} className="relative inline-block">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={`Sort products: ${selected.label}`}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openList();
          }
        }}
        className="inline-flex h-11 items-center gap-2.5 rounded-full border border-line bg-paper pl-4 pr-3.5 text-sm transition-colors hover:border-ink/25"
      >
        <span className="text-steel">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M2 4h12M4 8h8M6 12h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </span>
        <span>{selected.label}</span>
        <span className={`text-steel transition-transform ${open ? "rotate-180" : ""}`}>
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>

      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          tabIndex={-1}
          aria-label="Sort products"
          aria-activedescendant={`${listId}-${highlight}`}
          onKeyDown={onListKeyDown}
          className="absolute right-0 z-50 mt-2 min-w-full origin-top-right overflow-hidden rounded-[var(--radius-card)] border border-line bg-paper p-1.5 shadow-[0_2px_4px_rgba(22,25,29,0.04),0_16px_40px_-20px_rgba(22,25,29,0.45)] outline-none"
        >
          {SORT_OPTIONS.map((option, i) => {
            const isSelected = option.value === current;
            return (
              <li
                key={option.value || "default"}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={isSelected}
                onClick={() => choose(option.value)}
                onMouseEnter={() => setHighlight(i)}
                className={`flex cursor-pointer items-center gap-2.5 whitespace-nowrap rounded-full px-3.5 py-3 text-sm transition-colors ${
                  i === highlight ? "bg-mist" : ""
                } ${isSelected ? "font-medium" : ""}`}
              >
                <span className={isSelected ? "text-flame" : "text-transparent"} aria-hidden="true">
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M3 8.5l3.2 3.2L13 5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                {option.label}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
