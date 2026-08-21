# Deploying to cPanel with Git

The storefront is a **Node.js application**, not PHP. It runs through cPanel's
*Setup Node.js App* (Phusion Passenger), which starts `server.js`.

> `server.js` is already written and committed. You do not create it — you just
> name it as the startup file.

WordPress stays where it is on `wp.agfasgas.com`. Only the storefront lives here.

---

## Why the build happens on your machine

This host cannot compile the site. Its CloudLinux limits cap **Max address
space at exactly 4 GB**, and V8 reserves roughly 4 GB of *virtual* address space
for every WebAssembly memory instance the compiler creates. The reservation can
never fit, so `next build` fails with:

```
WebAssembly.instantiate(): Out of memory: Cannot allocate Wasm memory
```

This happens with Turbopack **and** with Webpack, and no `NODE_OPTIONS` value
changes it — it is a hard ceiling on address space, not a heap size.

So the built site is committed to git. **You build; the server only pulls and
restarts.** That makes deploys faster and removes the failure entirely.

---

## One-time setup

### 1. Push to GitHub

Create a **private** repository at <https://github.com/new> — no README, no
`.gitignore`. Then:

```bash
git remote add origin https://github.com/YOUR-USERNAME/agfas.git
git push -u origin main
```

### 2. Clone it on the server

cPanel → **Git Version Control** → *Create*:

| Field | Value |
| --- | --- |
| Clone URL | your GitHub repository URL |
| Repository Path | `agfasgas.com` |

A private repository needs an SSH deploy key: cPanel → *SSH Access* → *Manage
SSH Keys* → generate → copy the **public** key → add it on GitHub under your
repository's *Settings → Deploy keys*. Read-only is enough.

### 3. Create the Node.js application

cPanel → **Setup Node.js App** → *Create Application*:

| Field | Value |
| --- | --- |
| Node.js version | **20.9 or newer** |
| Application mode | Production |
| Application root | `agfasgas.com` |
| Application URL | `agfasgas.com` |
| Application startup file | `server.js` |

### 4. Environment variables

These are read **at runtime**, so they can be set at any point — unlike the
build-time values, which are already baked in by your local build.

| Variable | Value |
| --- | --- |
| `WP_URL` | `https://wp.agfasgas.com` |
| `SITE_URL` | `https://agfasgas.com` |
| `RECAPTCHA_SECRET_KEY` | your reCAPTCHA **secret** key |

The reCAPTCHA **site** key is not here: it is compiled into the JavaScript and
lives in `.env.production`. Only the secret is runtime, and it must never be
committed.

### 5. Install and start

1. **Run NPM Install**
2. **Restart**

There is no build step. Open `https://agfasgas.com`.

---

## Updating the site later

On your own machine:

```bash
npm run build
git add -A
git commit -m "Describe what changed"
git push
```

Then in cPanel:

1. **Git Version Control** → *Manage* → **Update from Remote**
2. **Setup Node.js App** → **Restart**

Run *Run NPM Install* again only if `package.json` changed.

> **Build before you commit.** The site that goes live is the `.next` folder in
> your last commit. Change code, forget to build, and you will push source
> changes that never reach the running site.

> Text edited in **AGFAS Content**, and products edited in WooCommerce, appear
> within about a minute with no deployment at all. The git cycle is only for
> code and design changes.

---

## If something goes wrong

**503 Service Unavailable**
The app is not running. Check the log in *Setup Node.js App*. Usually Node is
below 20.9, `npm install` has not been run, or `.next` is missing from the
checkout.

**The site loads but has no products**
Check `WP_URL` has no trailing slash, and that
`https://wp.agfasgas.com/wp-json/wc/store/v1/products` returns JSON.

**Forms say "Invalid domain for site key"**
Add `agfasgas.com` to your key at <https://www.google.com/recaptcha/admin>,
keeping `localhost` listed.

**Changes do not appear after a deploy**
You almost certainly pushed without running `npm run build` first.

---

## Could the host build it after all?

Possibly, if the native Linux compiler binaries are installed rather than the
WebAssembly fallback. In cPanel **Terminal**:

```bash
source /home/togebkrk/nodevenv/agfasgas.com/20/bin/activate && cd /home/togebkrk/agfasgas.com
```

```bash
ls node_modules/@next/ node_modules/@tailwindcss/
```

If `swc-linux-x64-gnu` and `oxide-linux-x64-gnu` are missing,
`npm install --include=optional` may fix it and let `npm run build` run on the
server. If they are present and the build still fails, the host is blocking
native modules and committing the build is the only route.

Either way the current setup works, so this is optional.

---

## After the first successful deploy

1. Set `AGFAS_STOREFRONT_ORIGIN` in `wordpress/agfas-headless.php` to
   `https://agfasgas.com` and re-upload it to `wp-content/mu-plugins/`.
   **Without this, customers who pay are returned to WordPress instead of your
   own confirmation page.**
2. Add `agfasgas.com` to your reCAPTCHA key, keeping `localhost`.
3. Set toyyibPay's **Category Code** in WooCommerce, or no order can complete.
4. Leave WooCommerce in **Coming soon** mode — it blocks the WordPress front end
   while leaving the REST API working, which is what this architecture wants.
5. Submit `https://agfasgas.com/sitemap.xml` in Google Search Console.
6. Place one real low-value order end to end before announcing the site.
