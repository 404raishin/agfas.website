"use client";

import { useSyncExternalStore } from "react";

type Theme = "light" | "dark";

/**
 * Runs before first paint so the page never flashes the wrong theme.
 * Kept as a string because it is injected into the document head directly.
 */
export const themeScript = `
(function () {
  try {
    var saved = localStorage.getItem("agfas-theme");
    var theme = saved === "light" || saved === "dark"
      ? saved
      : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", theme);
  } catch (e) {
    document.documentElement.setAttribute("data-theme", "light");
  }
})();
`;

/**
 * The active theme lives on the <html> element, set by the script above before
 * React runs. Subscribing to that attribute keeps the button's label correct
 * without React owning the value.
 */
export function subscribeToTheme(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => observer.disconnect();
}

export function getThemeSnapshot(): Theme {
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

export function ThemeToggle() {
  const theme = useSyncExternalStore<Theme>(subscribeToTheme, getThemeSnapshot, () => "light");
  const isDark = theme === "dark";

  function toggle() {
    const next: Theme = isDark ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("agfas-theme", next);
    } catch {
      // Private browsing — the choice just will not persist.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Light theme" : "Dark theme"}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line text-steel transition-colors hover:border-ink/25 hover:bg-mist hover:text-ink"
    >
      {/* Both icons ship; the root's data-theme decides which one shows, so the
          correct icon is painted even before hydration. */}
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
        className="hidden [:root[data-theme='light']_&]:block"
      >
        <circle cx="8" cy="8" r="3.25" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M8 1v1.75M8 13.25V15M15 8h-1.75M2.75 8H1M12.95 3.05l-1.24 1.24M4.29 11.71l-1.24 1.24M12.95 12.95l-1.24-1.24M4.29 4.29L3.05 3.05"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
        className="hidden [:root[data-theme='dark']_&]:block"
      >
        <path
          d="M13.5 9.6A5.8 5.8 0 016.4 2.5a5.8 5.8 0 107.1 7.1z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
