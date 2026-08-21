"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Quantity control: minus, a typeable field, plus.
 *
 * The field is `text` with `inputMode="numeric"` rather than `type="number"`.
 * That still raises the numeric keypad on phones, but avoids the desktop
 * spinner arrows and the scroll-wheel-changes-the-value trap that `number`
 * brings with it.
 *
 * Typing does not fire `onChange` on every keystroke — that would mean one
 * cart request per digit. It commits on blur, on Enter, or once typing has
 * paused. The pause matters on phones, where someone often types a quantity
 * and taps straight through to checkout without ever blurring the field.
 */
export function QuantityInput({
  value,
  onChange,
  disabled,
  label,
  min = 1,
  max = 999,
  size = "md",
}: {
  value: number;
  onChange: (quantity: number) => void;
  disabled?: boolean;
  /** Names the thing being counted, for screen readers. */
  label: string;
  min?: number;
  max?: number;
  size?: "sm" | "md";
}) {
  const [draft, setDraft] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);
  const onChangeRef = useRef(onChange);

  // Callers pass an inline arrow, so its identity changes every render. Held
  // in a ref instead, the debounce timer below is not restarted by unrelated
  // re-renders of the parent.
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  // Follow the source of truth when it changes elsewhere (another row, a
  // server recalculation), but never while the field is being edited.
  useEffect(() => {
    if (document.activeElement !== inputRef.current) setDraft(String(value));
  }, [value]);

  const clamp = (n: number) => Math.min(max, Math.max(min, n));

  // Commit shortly after typing stops, so the total keeps up without firing a
  // request per keystroke. An empty field is mid-edit, not a value of zero.
  useEffect(() => {
    if (draft === "" || draft === String(value)) return;
    const parsed = Number.parseInt(draft, 10);
    if (!Number.isFinite(parsed)) return;

    const timer = setTimeout(() => {
      const next = Math.min(max, Math.max(min, parsed));
      setDraft(String(next));
      if (next !== value) onChangeRef.current(next);
    }, 700);

    return () => clearTimeout(timer);
  }, [draft, value, min, max]);

  function commit(raw: string) {
    const parsed = Number.parseInt(raw.replace(/\D/g, ""), 10);
    if (!Number.isFinite(parsed)) {
      setDraft(String(value));
      return;
    }
    const next = clamp(parsed);
    setDraft(String(next));
    if (next !== value) onChange(next);
  }

  function step(delta: number) {
    const next = clamp(value + delta);
    setDraft(String(next));
    if (next !== value) onChange(next);
  }

  const box = size === "sm" ? "h-10" : "h-12";
  const btn = size === "sm" ? "h-10 w-10" : "h-12 w-11";
  const field = size === "sm" ? "w-10" : "w-12";

  return (
    <span className={`inline-flex ${box} items-center rounded-full border border-line bg-paper`}>
      <button
        type="button"
        disabled={disabled || value <= min}
        onClick={() => step(-1)}
        aria-label={`Decrease quantity of ${label}`}
        className={`flex ${btn} items-center justify-center rounded-l-full text-lg text-steel transition-colors hover:bg-mist hover:text-ink disabled:opacity-40`}
      >
        −
      </button>

      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="off"
        disabled={disabled}
        value={draft}
        aria-label={`Quantity of ${label}`}
        onChange={(e) => setDraft(e.target.value.replace(/\D/g, "").slice(0, 3))}
        onFocus={(e) => e.target.select()}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit(e.currentTarget.value);
            e.currentTarget.blur();
          }
          if (e.key === "ArrowUp") {
            e.preventDefault();
            step(1);
          }
          if (e.key === "ArrowDown") {
            e.preventDefault();
            step(-1);
          }
        }}
        className={`${field} bg-transparent text-center font-mono text-sm tabular-nums outline-none disabled:opacity-50`}
      />

      <button
        type="button"
        disabled={disabled || value >= max}
        onClick={() => step(1)}
        aria-label={`Increase quantity of ${label}`}
        className={`flex ${btn} items-center justify-center rounded-r-full text-lg text-steel transition-colors hover:bg-mist hover:text-ink disabled:opacity-40`}
      >
        +
      </button>
    </span>
  );
}
