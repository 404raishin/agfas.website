"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { getThemeSnapshot, subscribeToTheme } from "./theme-toggle";

type Grecaptcha = {
  render: (
    container: HTMLElement,
    params: {
      sitekey: string;
      theme?: "light" | "dark";
      callback: (token: string) => void;
      "expired-callback": () => void;
      "error-callback": () => void;
    },
  ) => number;
  reset: (widgetId?: number) => void;
};

declare global {
  interface Window {
    grecaptcha?: Grecaptcha & { ready?: (cb: () => void) => void };
    onAgfasRecaptchaLoad?: () => void;
  }
}

export const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? "";

/** The script is shared, so load it once no matter how many widgets mount. */
let scriptPromise: Promise<void> | null = null;

function loadRecaptcha(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.grecaptcha?.render) return Promise.resolve();

  if (!scriptPromise) {
    scriptPromise = new Promise<void>((resolve, reject) => {
      window.onAgfasRecaptchaLoad = () => resolve();
      const script = document.createElement("script");
      script.src =
        "https://www.google.com/recaptcha/api.js?onload=onAgfasRecaptchaLoad&render=explicit";
      script.async = true;
      script.defer = true;
      script.onerror = () => reject(new Error("reCAPTCHA script failed to load"));
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
}

/**
 * The "I'm not a robot" checkbox.
 *
 * Renders nothing when no site key is configured, so the forms keep working
 * before the keys are registered — the server skips verification in exactly
 * the same case, so the two stay in step.
 */
export function Recaptcha({
  onChange,
  resetSignal = 0,
}: {
  onChange: (token: string | null) => void;
  /** Change this to clear the tick after a failed submit. */
  resetSignal?: number;
}) {
  const holder = useRef<HTMLDivElement>(null);
  const widgetId = useRef<number | null>(null);
  const renderedTheme = useRef<"light" | "dark" | null>(null);
  const onChangeRef = useRef(onChange);
  const [failed, setFailed] = useState(false);

  // reCAPTCHA bakes its theme in at render time, so a theme switch means
  // rebuilding the widget. The tick clears with it, which is correct — the old
  // token belonged to the old widget.
  const theme = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, () => "light" as const);

  useEffect(() => {
    onChangeRef.current = onChange;
  });

  /**
   * Does the DOM work and reports what happened, rather than setting state
   * itself — that keeps every state change in the effect's callback below,
   * where it is unambiguously asynchronous.
   */
  const mount = useCallback(async (): Promise<"ok" | "failed" | "skip"> => {
    if (!RECAPTCHA_SITE_KEY || !holder.current) return "skip";

    try {
      await loadRecaptcha();
    } catch {
      return "failed";
    }
    if (!window.grecaptcha?.render || !holder.current) return "skip";

    // Already showing this theme's widget — re-rendering would throw.
    if (renderedTheme.current === theme && widgetId.current !== null) return "skip";

    // reCAPTCHA refuses to render twice into the same node ("reCAPTCHA has
    // already been rendered in this element"), which React's development
    // double-mount triggers every time. Giving it a fresh child on each render
    // sidesteps that, and is also how a theme switch gets a clean widget.
    holder.current.innerHTML = "";
    const target = document.createElement("div");
    holder.current.appendChild(target);

    try {
      widgetId.current = window.grecaptcha.render(target, {
        sitekey: RECAPTCHA_SITE_KEY,
        theme,
        callback: (token) => onChangeRef.current(token),
        "expired-callback": () => onChangeRef.current(null),
        "error-callback": () => onChangeRef.current(null),
      });
      renderedTheme.current = theme;
    } catch (err) {
      console.error("[recaptcha] could not render the widget", err);
      return "failed";
    }
    return "ok";
  }, [theme]);

  useEffect(() => {
    let alive = true;
    void mount().then((result) => {
      if (!alive) return;
      if (result === "failed") setFailed(true);
      // A freshly built widget has no tick, so any token the parent still
      // holds belongs to the old one.
      if (result === "ok") onChangeRef.current(null);
    });
    return () => {
      alive = false;
    };
  }, [mount]);

  // Clear the tick when the parent asks. A token is single-use, so a failed
  // submit must not be retried with the same one. The parent clears its own
  // copy when it raises the signal.
  useEffect(() => {
    if (resetSignal === 0) return;
    if (widgetId.current !== null && window.grecaptcha?.reset) {
      window.grecaptcha.reset(widgetId.current);
    }
  }, [resetSignal]);

  if (!RECAPTCHA_SITE_KEY) return null;

  if (failed) {
    return (
      <p role="alert" className="text-sm text-flame-deep">
        The robot check could not load. Please check your connection, or contact
        us directly.
      </p>
    );
  }

  return <div ref={holder} className="min-h-[78px]" />;
}
