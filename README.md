# AGFAS storefront

Headless catalogue and shop for AGFAS — gas leak detectors and fire safety
equipment. Next.js 16 (App Router) front end, WordPress + WooCommerce back end.

- **Front end:** Next.js 16, React 19, Tailwind v4, TypeScript
- **Back end:** WordPress at `https://wp.agfasgas.com` (headless)
- **Catalogue + cart:** WooCommerce Store API (`wc/store/v1`)
- **Editorial:** WordPress REST API (`wp/v2`)
- **Currency:** MYR (RM), read from the store rather than hardcoded

## Running it

```bash
npm run dev
```

Environment lives in `.env.local` (git-ignored):

| Variable | Purpose |
| --- | --- |
| `WP_URL` | WordPress origin the server fetches from |
| `SITE_URL` | This site's own origin, used for redirects and metadata |
| `WC_CONSUMER_KEY` / `WC_CONSUMER_SECRET` | Only used by `npm run seed` |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` / `RECAPTCHA_SECRET_KEY` | Optional; turns on the robot check |

## Seeding the catalogue

`npm run seed` writes the products in `scripts/catalog.mjs` into WooCommerce. It
matches on SKU, so re-running updates rather than duplicates.

```bash
npm run seed -- --dry   # show what would change, write nothing
npm run seed            # apply
```

Needs WooCommerce keys with **Read/Write** permission, from
*WooCommerce → Settings → Advanced → REST API*.

Product photos are not seeded — add them in WooCommerce and they appear
automatically.

## WordPress side

Two files go in `wp-content/mu-plugins/` (create the folder if it does not
exist — mu-plugins need no activation). They are deliberately separate: a
problem in one cannot take down the other.

### `agfas-content.php` — editing site text

Adds the **AGFAS Content** menu, and serves that text at
`GET /wp-json/agfas/v1/content`.

Without it, the site falls back to the defaults in `lib/content.ts` and still
renders correctly — it just cannot be edited from WordPress.

### `agfas-headless.php` — the commerce bridge

Set `AGFAS_STOREFRONT_ORIGIN` in it to the live storefront URL. Provides:

- `GET /wp-json/agfas/v1/payment-methods` — enabled gateways for checkout
- `POST /wp-json/agfas/v1/quote` — quotation requests
- **AGFAS Enquiries** — every quotation and enquiry, kept in WordPress

Without it, no payment methods appear at checkout and quotation requests tell
people to email instead.

The bridge reads the quotation address from the content plugin when present,
guarded by `function_exists`, and falls back to the WordPress admin email
otherwise. mu-plugins load alphabetically, so `agfas-content.php` is always
available first.

## Editing site text from WordPress

With the plugin installed, **AGFAS Content** appears in the WordPress admin
menu. It holds every editable string on the storefront — hero headline, spec
strip, section headings, the three installation steps, the closing call to
action, and contact details.

Edits appear within about a minute. A blank field falls back to the original
wording, and if WordPress is unreachable the site still renders from
`lib/content.ts` rather than showing blank sections.

To add a new editable field: add it to `agfas_schema()` in the plugin, and to
`CONTENT_DEFAULTS` in `lib/content.ts`.

## Theme switching

The header has a light/dark toggle. Colours are CSS custom properties on
`:root`, re-declared under `:root[data-theme="dark"]`, and Tailwind utilities
point at them via `@theme inline` — so switching theme is a variable swap, not a
second set of classes.

An inline script in the document head applies the saved choice before first
paint, so there is no flash of the wrong theme. The choice persists in
`localStorage`; with no choice saved, the system preference wins.

Solid controls use the `solid` / `on-solid` token pair so they invert correctly
in both themes. Orange is constant in both.

## Quotation requests

Alongside checkout, shoppers can ask for a quotation at `/quote`. Anything in
the cart is attached automatically. The form posts to `/api/quote`, which relays
to WordPress so the email goes out through the site's existing mail setup — the
sales address is never exposed in the page source.

Set the destination in **AGFAS Content → Contact details → Where quotation
requests are sent**.

### Where enquiries are kept

Each submission is **stored in WordPress before the email is attempted**, and
listed under **AGFAS Content → Enquiries**: who sent it, their email and phone,
the products they asked about, the gas type, and their message.

That ordering matters. WordPress mail on shared hosting is unreliable, and an
email-only flow silently loses sales leads when delivery fails. The list marks
each row **Sent** or **Failed**, so a broken mail setup is visible rather than
invisible — worth acting on, since WooCommerce order confirmations go out the
same way.

Enquiries are created by the REST endpoint only. The screen is read-only: no
"Add New", and nothing there is editable.

## Robot check (reCAPTCHA v2)

The enquiry, quotation and checkout forms can show Google's "I'm not a robot"
checkbox. Register a **reCAPTCHA v2 → Checkbox** key pair at
<https://www.google.com/recaptcha/admin>, listing every domain the site runs on
(including `localhost` for development), and put them in `.env.local`.

**With no keys set the check is dormant**: no widget renders and the server
skips verification, so nothing is blocked before the keys exist. Both halves
read the same absent configuration, so they can never disagree.

Once set:

- The checkbox appears above the submit button, which stays disabled until it
  is ticked.
- The token is verified server-side against Google before an enquiry is
  relayed or an order is placed. The secret key never reaches the browser.
- A token is single-use, so any failed submit clears the tick and asks for a
  fresh one.
- The widget follows the site's light/dark theme. reCAPTCHA fixes its theme at
  render time, so a theme switch rebuilds the widget.

> Google publishes a test key pair that verifies **any** token. Never leave it
> in `.env.local` — a visible checkbox that accepts everything is worse than
> no checkbox at all.

## How the cart and checkout work

The storefront is fully headless: **customers never reach WordPress.** Browsing,
cart, checkout and order confirmation all happen on this site.

WordPress does not send CORS allow-origin headers, so the browser cannot call
the Store API directly — and it never should. Every call is proxied through
route handlers under `/api`, which hold the Store API `Cart-Token` in an
httpOnly cookie and fetch a fresh `Nonce` before each write. The backend URL
and session never reach client JavaScript.

| Step | Route | Store API call |
| --- | --- | --- |
| Cart read and mutations | `/api/cart` | `cart`, `cart/add-item`, … |
| Address → delivery quote | `/api/checkout/customer` | `cart/update-customer` |
| Choose delivery option | `/api/checkout/shipping` | `cart/select-shipping-rate` |
| Place the order | `/api/checkout/place` | `checkout` |
| Confirmation | `/order/[id]?key=…` | `order/{id}` |

Because WordPress is never customer-facing, leaving it in WooCommerce's
**Coming soon** mode is desirable — it blocks the WordPress front end while
leaving the REST API (and therefore this site) fully working.

### Payment gateways

Offline gateways (bank transfer, cash on delivery, cheque) complete entirely on
this site. Gateways that authorise off-site return a `redirect_url`; the
storefront follows it only when it points somewhere other than WordPress, so
customers go to the payment provider and come back here — never to wp-admin's
front end.

**At least one gateway must be enabled in WooCommerce or no order can be
placed.** The checkout says so plainly rather than failing silently.

## Structure

```
app/
  page.tsx              home
  products/             catalogue + [slug] detail
  cart/                 cart
  quote/                quotation request
  blog/                 posts + [slug]
  about/  contact/
  checkout/             headless checkout
  order/[id]/           order confirmation
  api/cart/             Store API proxy (cart read + mutations)
  api/checkout/         customer, shipping, place order
  api/quote/            quotation relay to WordPress
components/             header, footer, cart, product card, LEL meter, theme toggle
lib/
  wp.ts                 WordPress + Store API data layer
  content.ts            editable site text + defaults
  cart-server.ts        cart session, tokens, nonces
  checkout-server.ts    addresses, shipping rates, order placement
  format.ts             minor-unit price formatting
scripts/                catalogue data + seeder
wordpress/              mu-plugin for the WP side
```

## Design

White ground, light-orange alert (`#FF8A3D`). Orange is the only warm colour in
either theme, so it always reads as "something needs attention". Archivo for
display, Public Sans for body, JetBrains Mono for specs and readouts.

The hero meter is a live %LEL readout — the threshold at which leaked gas
becomes ignitable, and the thing every product on the site exists to catch.

### Swapping in the real logo

Replace `public/logo.svg` with the real mark. `components/logo.tsx` picks it up
with no other changes. If the file is a PNG, update the `src` in that file.
