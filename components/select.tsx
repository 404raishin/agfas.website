"use client";

import { useEffect, useId, useRef, useState } from "react";

export type SelectOption = { value: string; label: string };

/**
 * A select that the site draws itself.
 *
 * A native `<select>` hands its option list to the operating system, which
 * renders a white panel with a blue highlight and square corners no matter
 * what the page's CSS says — jarring against the dark theme, and off-brand in
 * light. This follows the ARIA listbox pattern instead, so keyboard and
 * screen-reader behaviour matches what the native control would have given.
 *
 * Pass `name` to also emit a hidden input, so plain `FormData` reads still
 * work for forms that are not otherwise controlled.
 */
export function Select({
  value,
  onChange,
  options,
  name,
  labelledBy,
  ariaLabel,
  align = "left",
  fullWidth = true,
  leadingIcon,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  options: readonly SelectOption[];
  /** Emits a hidden input under this name for FormData submissions. */
  name?: string;
  /** id of the visible <label> that names this control. */
  labelledBy?: string;
  /** Use when there is no visible label. */
  ariaLabel?: string;
  align?: "left" | "right";
  fullWidth?: boolean;
  leadingIcon?: React.ReactNode;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);

  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();

  const selectedIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  const selected = options[selectedIndex];

  function choose(next: string) {
    setOpen(false);
    buttonRef.current?.focus();
    if (next !== value) onChange(next);
  }

  function openList() {
    if (disabled) return;
    setHighlight(selectedIndex);
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

  useEffect(() => {
    if (open) listRef.current?.focus();
  }, [open]);

  // Long lists (the state picker has sixteen) scroll, so keep the highlighted
  // option in view when moving by keyboard.
  useEffect(() => {
    if (!open) return;
    const el = document.getElementById(`${listId}-${highlight}`);
    el?.scrollIntoView({ block: "nearest" });
  }, [open, highlight, listId]);

  function onListKeyDown(e: React.KeyboardEvent) {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlight((i) => (i + 1) % options.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlight((i) => (i - 1 + options.length) % options.length);
        break;
      case "Home":
        e.preventDefault();
        setHighlight(0);
        break;
      case "End":
        e.preventDefault();
        setHighlight(options.length - 1);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        choose(options[highlight].value);
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        buttonRef.current?.focus();
        break;
      case "Tab":
        setOpen(false);
        break;
      default:
        // Type a letter to jump, the way a native select does.
        if (e.key.length === 1 && /\S/.test(e.key)) {
          const from = highlight + 1;
          const found = options.findIndex((o, i) =>
            i >= from && o.label.toLowerCase().startsWith(e.key.toLowerCase()),
          );
          const wrapped =
            found === -1
              ? options.findIndex((o) => o.label.toLowerCase().startsWith(e.key.toLowerCase()))
              : found;
          if (wrapped !== -1) setHighlight(wrapped);
        }
    }
  }

  return (
    <div ref={rootRef} className={`relative ${fullWidth ? "block" : "inline-block"}`}>
      {name && <input type="hidden" name={name} value={value} />}

      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-labelledby={labelledBy}
        aria-label={ariaLabel}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openList();
          }
        }}
        className={`inline-flex h-12 items-center gap-2.5 rounded-lg border border-line bg-paper pl-4 pr-3.5 text-sm transition-colors hover:border-ink/25 disabled:opacity-55 ${
          fullWidth ? "w-full justify-between" : ""
        }`}
      >
        <span className="flex min-w-0 items-center gap-2.5">
          {leadingIcon && <span className="shrink-0 text-steel">{leadingIcon}</span>}
          <span className="truncate">{selected?.label ?? ""}</span>
        </span>
        <span className={`shrink-0 text-steel transition-transform ${open ? "rotate-180" : ""}`}>
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M4 6l4 4 4-4"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>

      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          tabIndex={-1}
          aria-labelledby={labelledBy}
          aria-label={ariaLabel}
          aria-activedescendant={`${listId}-${highlight}`}
          onKeyDown={onListKeyDown}
          className={`absolute z-50 mt-2 max-h-72 overflow-auto rounded-[var(--radius-card)] border border-line bg-paper p-1.5 shadow-[0_2px_4px_rgba(22,25,29,0.04),0_16px_40px_-20px_rgba(22,25,29,0.45)] outline-none ${
            align === "right" ? "right-0" : "left-0"
          } ${fullWidth ? "w-full" : "min-w-full"}`}
        >
          {options.map((option, i) => {
            const isSelected = option.value === value;
            return (
              <li
                key={option.value || "__default"}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={isSelected}
                onClick={() => choose(option.value)}
                onMouseEnter={() => setHighlight(i)}
                className={`flex cursor-pointer items-center gap-2.5 rounded-lg px-3.5 py-3 text-sm transition-colors ${
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
                <span className="min-w-0">{option.label}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
