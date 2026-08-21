/**
 * Google reCAPTCHA v2 ("I'm not a robot" checkbox) verification.
 *
 * The secret key never leaves the server. If no secret is configured the
 * check is skipped rather than failing closed — otherwise adding this would
 * have blocked every enquiry and every order until the keys were registered.
 */

const VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

export type RecaptchaResult = { ok: boolean; error?: string };

/** True once the keys are set, so callers can require a token. */
export function recaptchaConfigured(): boolean {
  return Boolean(process.env.RECAPTCHA_SECRET_KEY);
}

export async function verifyRecaptcha(
  token: string | null | undefined,
  remoteIp?: string | null,
): Promise<RecaptchaResult> {
  const secret = process.env.RECAPTCHA_SECRET_KEY;

  // Not set up yet — let the request through.
  if (!secret) return { ok: true };

  if (!token) {
    return { ok: false, error: "Please confirm you are not a robot." };
  }

  const body = new URLSearchParams({ secret, response: token });
  if (remoteIp) body.set("remoteip", remoteIp);

  try {
    const res = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store",
    });

    if (!res.ok) {
      return { ok: false, error: "The robot check could not be completed. Please try again." };
    }

    const data = (await res.json()) as {
      success?: boolean;
      "error-codes"?: string[];
    };

    if (data.success) return { ok: true };

    const codes = data["error-codes"] ?? [];

    // An expired or reused token is the visitor's to fix by ticking again.
    if (codes.includes("timeout-or-duplicate")) {
      return { ok: false, error: "That check expired. Please tick the box again." };
    }
    // A bad key is our problem, not theirs — say something they can act on.
    if (codes.includes("invalid-input-secret") || codes.includes("missing-input-secret")) {
      console.error("[recaptcha] secret key rejected by Google:", codes);
      return { ok: false, error: "The robot check is misconfigured. Please contact us directly." };
    }

    return { ok: false, error: "The robot check failed. Please tick the box and try again." };
  } catch (err) {
    console.error("[recaptcha] verification request failed", err);
    return { ok: false, error: "The robot check could not be reached. Please try again." };
  }
}

/** Best-effort client IP, which reCAPTCHA uses as an extra signal. */
export function clientIpFrom(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip");
}
