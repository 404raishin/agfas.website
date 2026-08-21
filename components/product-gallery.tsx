"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { WooImage } from "@/lib/types";

const ZOOM = 2.5;

export function ProductGallery({ images, name }: { images: WooImage[]; name: string }) {
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });

  const closeRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLButtonElement>(null);

  const count = images.length;
  const current = images[active];

  const go = useCallback(
    (delta: number) => {
      setZoomed(false);
      setActive((i) => (i + delta + count) % count);
    },
    [count],
  );

  const close = useCallback(() => {
    setOpen(false);
    setZoomed(false);
  }, []);

  // Keyboard control, and keep the page behind from scrolling.
  useEffect(() => {
    if (!open) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    }

    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    // Captured now so cleanup returns focus to the button that opened this.
    const opener = openerRef.current;

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      opener?.focus();
    };
  }, [open, close, go]);

  /** Zoom toward wherever the viewer pointed, the way a loupe would. */
  function pointAt(e: React.MouseEvent | React.TouchEvent) {
    const rect = e.currentTarget.getBoundingClientRect();
    const point = "touches" in e ? e.touches[0] : (e as React.MouseEvent);
    if (!point) return;
    setOrigin({
      x: ((point.clientX - rect.left) / rect.width) * 100,
      y: ((point.clientY - rect.top) / rect.height) * 100,
    });
  }

  if (count === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-[var(--radius-card)] border border-line bg-mist">
        <span className="font-mono text-[0.625rem] uppercase tracking-[0.18em] text-steel">
          No image
        </span>
      </div>
    );
  }

  return (
    <div>
      {/* ------------------------------ main image ----------------------------- */}
      <button
        ref={openerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Open ${name} image ${active + 1} of ${count} at full size`}
        className="group relative block aspect-square w-full cursor-zoom-in overflow-hidden rounded-[var(--radius-card)] border border-line bg-paper"
      >
        <Image
          src={current.src}
          alt={current.alt || name}
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-contain p-4 transition-transform duration-300 group-hover:scale-[1.02]"
          priority
        />
        <span className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-solid/80 px-3 py-1.5 font-mono text-[0.625rem] uppercase tracking-[0.14em] text-on-solid opacity-0 transition-opacity group-hover:opacity-100">
          <ZoomIcon />
          Zoom
        </span>
      </button>

      {/* ------------------------------ thumbnails ----------------------------- */}
      {count > 1 && (
        <ul className="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-5">
          {images.map((img, i) => (
            <li key={`${img.id}-${img.src}`}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Show image ${i + 1} of ${count}`}
                aria-current={i === active}
                className={`relative block aspect-square w-full overflow-hidden rounded-lg border bg-paper transition-colors ${
                  i === active ? "border-flame" : "border-line hover:border-ink/30"
                }`}
              >
                <Image
                  src={img.thumbnail || img.src}
                  alt=""
                  fill
                  sizes="20vw"
                  className="object-contain p-1.5"
                />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* ------------------------------- lightbox ------------------------------ */}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${name} images`}
          className="fixed inset-0 z-[100] flex flex-col bg-ink/95 backdrop-blur-sm"
          onClick={close}
        >
          <div className="flex items-center justify-between px-5 py-4 sm:px-8">
            <span className="font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-paper/70">
              {active + 1} / {count}
            </span>
            <button
              ref={closeRef}
              type="button"
              onClick={close}
              aria-label="Close image viewer"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-paper/25 text-paper transition-colors hover:bg-paper/10"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Stop clicks on the image itself from closing the viewer. */}
          <div
            className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-4"
            onClick={(e) => e.stopPropagation()}
          >
            {count > 1 && (
              <NavButton side="left" onClick={() => go(-1)} />
            )}

            <div
              onClick={(e) => {
                pointAt(e);
                setZoomed((z) => !z);
              }}
              onMouseMove={(e) => zoomed && pointAt(e)}
              onTouchMove={(e) => zoomed && pointAt(e)}
              className={`relative h-full w-full max-w-4xl overflow-hidden ${
                zoomed ? "cursor-zoom-out" : "cursor-zoom-in"
              }`}
            >
              <Image
                key={current.src}
                src={current.src}
                alt={current.alt || name}
                fill
                sizes="100vw"
                quality={90}
                className="object-contain transition-transform duration-200 ease-out"
                style={{
                  transform: zoomed ? `scale(${ZOOM})` : "scale(1)",
                  transformOrigin: `${origin.x}% ${origin.y}%`,
                }}
              />
            </div>

            {count > 1 && <NavButton side="right" onClick={() => go(1)} />}
          </div>

          <p className="pb-5 text-center font-mono text-[0.625rem] uppercase tracking-[0.14em] text-paper/50">
            {zoomed ? "Move to pan · click to zoom out" : "Click the image to zoom"}
          </p>
        </div>
      )}
    </div>
  );
}

function NavButton({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "left" ? "Previous image" : "Next image"}
      className={`absolute z-10 inline-flex h-11 w-11 items-center justify-center rounded-full border border-paper/25 bg-ink/40 text-paper transition-colors hover:bg-paper/15 ${
        side === "left" ? "left-2 sm:left-4" : "right-2 sm:right-4"
      }`}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
        <path
          d={side === "left" ? "M10 3L5 8l5 5" : "M6 3l5 5-5 5"}
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </button>
  );
}

function ZoomIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" aria-hidden="true" fill="none">
      <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10.5 10.5L14 14M7 5.2v3.6M5.2 7h3.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
