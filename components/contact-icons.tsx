/**
 * Contact and social marks.
 *
 * Drawn as 1.6-weight outlines on a 24px grid so they sit in the same icon
 * language as the rest of the site (theme toggle, chevrons, sort control)
 * rather than dropping in filled brand logos that would read as foreign.
 */

const base = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function MailIcon() {
  return (
    <svg {...base}>
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="M4.2 7.4l7.1 5a1.2 1.2 0 0 0 1.4 0l7.1-5" />
    </svg>
  );
}

export function PhoneIcon() {
  return (
    <svg {...base}>
      <path d="M6.4 3.5h3l1.5 3.9-2 1.4a12.2 12.2 0 0 0 6.3 6.3l1.4-2 3.9 1.5v3a2 2 0 0 1-2.2 2A17.2 17.2 0 0 1 4.4 5.7a2 2 0 0 1 2-2.2z" />
    </svg>
  );
}

export function WhatsAppIcon() {
  return (
    <svg {...base}>
      {/* Bubble and tail as an outline, matching the other marks. */}
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22z" />
      {/* The handset is filled: as a 1.6 stroke it collapses into a smudge at
          this size, and the handset is what makes the mark readable. */}
      <path
        fill="currentColor"
        stroke="none"
        d="M10.05 8.3c-.16-.35-.32-.36-.47-.36h-.4c-.14 0-.36.05-.55.26-.19.2-.72.7-.72 1.7 0 1 .74 1.97.84 2.1.1.14 1.44 2.23 3.5 3.05 1.7.68 2.05.55 2.42.51.37-.03 1.2-.49 1.38-.96.17-.48.17-.88.12-.97-.05-.08-.19-.13-.4-.23l-1.35-.65c-.18-.08-.31-.06-.44.08l-.47.58c-.1.12-.21.13-.4.05-.2-.1-.88-.32-1.68-1.04-.62-.55-1.04-1.24-1.16-1.45-.11-.2-.01-.32.09-.42l.3-.35c.08-.1.11-.18.17-.3.06-.12.03-.23-.01-.32z"
      />
    </svg>
  );
}

export function InstagramIcon() {
  return (
    <svg {...base}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="3.8" />
      <circle cx="17.1" cy="6.9" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function YouTubeIcon() {
  return (
    <svg {...base}>
      <rect x="2.5" y="5.8" width="19" height="12.4" rx="4" />
      <path d="M10.4 9.6l5.1 2.4-5.1 2.4z" />
    </svg>
  );
}

export function FacebookIcon() {
  return (
    <svg {...base}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      {/* The stem stops short of the frame; running it to y=21 collided with
          the rounded border. */}
      <path d="M15 8.5h-1.3a1.7 1.7 0 0 0-1.7 1.7V18.5M10.2 13h4.6" />
    </svg>
  );
}

export function TikTokIcon() {
  return (
    <svg {...base}>
      <path d="M14.6 3.5v10.9a3.6 3.6 0 1 1-3.6-3.6" />
      <path d="M14.6 3.5a5 5 0 0 0 5 5" />
    </svg>
  );
}
