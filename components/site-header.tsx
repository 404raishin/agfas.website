"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Logo } from "./logo";
import { useCart } from "./cart-provider";
import { ThemeToggle } from "./theme-toggle";

export type NavItem = { href: string; label: string };

export function SiteHeader({ nav }: { nav: NavItem[] }) {
  const pathname = usePathname();
  const { count } = useCart();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-5 sm:px-8">
        <Link href="/" aria-label="AGFAS home" className="shrink-0">
          <Logo />
        </Link>

        <nav className="ml-auto hidden items-center gap-7 md:flex" aria-label="Main">
          {nav.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm transition-colors hover:text-ink ${
                  active ? "text-ink font-medium" : "text-steel"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <ThemeToggle />
          <Link
            href="/cart"
            onClick={() => setOpen(false)}
            className="relative inline-flex h-10 items-center gap-2 rounded-full border border-line px-4 text-sm font-medium transition-colors hover:border-ink/25 hover:bg-mist"
          >
            Cart
            <span
              className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 font-mono text-[0.6875rem] tabular-nums ${
                count > 0 ? "bg-flame text-on-flame" : "bg-mist text-steel"
              }`}
            >
              {count}
            </span>
          </Link>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line md:hidden"
          >
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
              {open ? (
                <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              ) : (
                <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-nav" className="border-t border-line bg-paper px-5 py-3 md:hidden" aria-label="Main">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block border-b border-line py-3 text-sm last:border-0"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
