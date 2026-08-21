/**
 * Contact fields are typed by hand in WordPress, so they arrive in whatever
 * shape felt natural — a phone number in the WhatsApp box, an @handle in the
 * Instagram box, a bare domain. WordPress's URL sanitiser then prefixes
 * `http://`, turning "0193322915" into the dead link "http://0193322915".
 *
 * These normalise the common shapes into links that actually work, rather than
 * demanding the exact format be remembered.
 */

/** Default country calling code for bare local numbers (Malaysia). */
const COUNTRY_CODE = "60";

function looksLikeUrl(value: string): boolean {
  return /^https?:\/\/[^/]*\.[a-z]{2,}/i.test(value.trim());
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Turn whatever is in the WhatsApp field into a wa.me link.
 * Accepts "0193322915", "+60 19-332 2915", "wa.me/60193322915", or a full URL.
 */
export function whatsappHref(value: string): string | null {
  const raw = value.trim();
  if (!raw) return null;

  const isWaLink = /wa\.me|whatsapp\.com/i.test(raw);

  // A wa.me link is not automatically valid: WhatsApp rejects local numbers,
  // so "wa.me/0193322915" fails while "wa.me/60193322915" works. Pull the
  // number out and normalise it either way.
  let digits: string;
  if (isWaLink) {
    const match = raw.match(/(?:wa\.me\/|[?&]phone=)\+?([\d\s-]+)/i);
    if (!match) return looksLikeUrl(raw) ? raw : null;
    digits = digitsOnly(match[1]);
  } else {
    digits = digitsOnly(raw);
  }

  if (digits.length < 7) return looksLikeUrl(raw) ? raw : null;

  const international = digits.startsWith(COUNTRY_CODE)
    ? digits
    : digits.startsWith("0")
      ? COUNTRY_CODE + digits.slice(1)
      : COUNTRY_CODE + digits;

  // Keep a prefilled message if one was set on the original link.
  const text = raw.match(/[?&]text=([^&]*)/i);
  return `https://wa.me/${international}${text ? `?text=${text[1]}` : ""}`;
}

const PROFILE_BASE: Record<string, string> = {
  instagram: "https://instagram.com/",
  youtube: "https://youtube.com/@",
  facebook: "https://facebook.com/",
  tiktok: "https://tiktok.com/@",
};

/**
 * Accepts a full URL, a bare domain, or just a handle such as "agfasgas" or
 * "@agfasgas", and returns something a browser can actually open.
 */
export function profileHref(platform: keyof typeof PROFILE_BASE, value: string): string | null {
  const raw = value.trim().replace(/\s+/g, "");
  if (!raw) return null;

  if (looksLikeUrl(raw)) return raw;

  // A bare domain that WordPress has not prefixed, e.g. "instagram.com/agfas".
  if (/^[a-z0-9-]+\.[a-z]{2,}\//i.test(raw)) return `https://${raw}`;

  // WordPress may have prefixed a handle, leaving "http://agfasgas".
  const handle = raw.replace(/^https?:\/\//i, "").replace(/^@/, "");
  if (!handle) return null;

  return PROFILE_BASE[platform] + handle;
}
