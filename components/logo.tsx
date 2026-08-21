import Image from "next/image";

/**
 * Placeholder wordmark. Drop the real file at `public/logo.svg` (or .png) and
 * this switches to it automatically — nothing else needs editing.
 */
export function Logo({ className = "", showText = true }: { className?: string; showText?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span className="relative block h-8 w-8 shrink-0">
        <Image
          src="/logo.svg"
          alt=""
          fill
          sizes="32px"
          className="object-contain"
          priority
        />
      </span>
      {showText && (
        <span className="font-display text-[1.35rem] font-bold tracking-[-0.04em] text-ink">
          AGFAS
        </span>
      )}
    </span>
  );
}
