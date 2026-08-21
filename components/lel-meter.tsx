"use client";

import { useEffect, useReducer } from "react";

/**
 * The signature element: a working %LEL readout.
 *
 * LEL is the Lower Explosive Limit — the concentration at which leaked gas
 * becomes ignitable. Detectors idle near zero and trip at 20% LEL, long
 * before the air can catch. The meter runs that cycle so the value of the
 * product is visible before a shopper has read a single spec.
 */

const ALARM_AT = 20; // % LEL — the trip threshold
const CEILING = 50; // % LEL — full scale

type State = { value: number; phase: "idle" | "rising" | "alarm" | "clearing" };

function reduce(state: State): State {
  const { value, phase } = state;
  switch (phase) {
    case "idle": {
      // Sensor noise around zero, then a leak begins.
      const next = Math.max(0, value + (Math.random() - 0.45) * 0.35);
      return next > 1.6 ? { value: next, phase: "rising" } : { value: next, phase: "idle" };
    }
    case "rising": {
      const next = value + 0.85 + Math.random() * 0.5;
      return next >= ALARM_AT + 6 ? { value: next, phase: "alarm" } : { value: next, phase: "rising" };
    }
    case "alarm":
      return value > ALARM_AT + 12 ? { value, phase: "clearing" } : { value: value + 0.5, phase: "alarm" };
    case "clearing": {
      const next = value - 1.4;
      return next <= 0.2 ? { value: 0.1, phase: "idle" } : { value: next, phase: "clearing" };
    }
  }
}

export function LelMeter() {
  const [state, tick] = useReducer(reduce, { value: 0.1, phase: "idle" } as State);

  useEffect(() => {
    // Readers who ask for reduced motion get a static safe reading instead.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(tick, 90);
    return () => clearInterval(id);
  }, []);

  const value = state.value;
  const alarming = value >= ALARM_AT;
  const pct = Math.min(100, (value / CEILING) * 100);

  return (
    <figure
      className="rounded-[var(--radius-card)] border border-line bg-paper p-6 shadow-[0_1px_2px_rgba(22,25,29,0.04),0_12px_40px_-24px_rgba(22,25,29,0.35)] sm:p-8"
      aria-label={`Live demonstration: sensor reading ${value.toFixed(1)} percent LEL`}
    >
      <div className="flex items-start justify-between gap-4">
        <span className="eyebrow">
          <span
            className="status-dot"
            style={alarming ? { background: "var(--color-flame-deep)", animationDuration: "0.5s" } : undefined}
          />
          {alarming ? "Alarm" : "Monitoring"}
        </span>
        <span className="font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-steel">
          LPG · CH₄
        </span>
      </div>

      <div className="mt-6 flex items-baseline gap-2">
        <span
          className="font-mono text-[3.25rem] leading-none font-medium tabular-nums transition-colors duration-200 sm:text-[4rem]"
          style={{ color: alarming ? "var(--color-flame-deep)" : "var(--color-ink)" }}
        >
          {value.toFixed(1)}
        </span>
        <span className="font-mono text-sm text-steel">%LEL</span>
      </div>

      {/* Scale: safe run, then the orange band the alarm sits in. */}
      <div className="mt-5">
        <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-mist">
          <div
            className="absolute inset-y-0 right-0 bg-flame-soft"
            style={{ width: `${100 - (ALARM_AT / CEILING) * 100}%` }}
          />
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-[width,background-color] duration-100 ease-linear"
            style={{
              width: `${pct}%`,
              background: alarming ? "var(--color-flame-deep)" : "var(--color-safe)",
            }}
          />
          <div
            className="absolute inset-y-0 w-px bg-solid/35"
            style={{ left: `${(ALARM_AT / CEILING) * 100}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between font-mono text-[0.625rem] uppercase tracking-[0.14em] text-steel">
          <span>0</span>
          <span className={alarming ? "text-flame-deep" : undefined}>
            Alarm · {ALARM_AT}%
          </span>
          <span>{CEILING}</span>
        </div>
      </div>

      <figcaption className="hairline mt-6 pt-4 text-sm leading-relaxed text-steel">
        {alarming
          ? "Above 20% LEL the siren sounds and the solenoid valve cuts the gas line."
          : "An AGFAS sensor samples the air continuously and trips at 20% LEL — well below the level where gas can ignite."}
      </figcaption>
    </figure>
  );
}
