# Deploying to cPanel with Git

The storefront is a **Node.js application**, not PHP. It needs cPanel's
*Setup Node.js App* (Phusion Passenger), which runs `server.js`.

> `server.js` is already written and committed. You do not create it — you just
> name it as the startup file in step 3.

WordPress stays exactly where it is on `wp.agfasgas.com`. Only the storefront
is deployed here.

---

## One-time setup

### 1. Push the code to GitHub

Create a **private** repository at <https://github.com/new> — no README, no
`.gitignore` (this project has both). Then, from the project folder:

```bash
git remote add origin https://github.com/YOUR-USERNAME/agfas.git
git push -u origin main
```

### 2. Clone it on the server

cPanel → **Git Version Control** → *Create*:

| Field | Value |
| --- | --- |
| Clone URL | your GitHub repository URL |
| Repository Path | `agfas` (creates `/home/USER/agfas`) |

A private repository needs an SSH deploy key: cPanel → *SSH Access* → *Manage
SSH Keys* → generate one, copy the **public** key, and add it on GitHub under
your repository's *Settings → Deploy keys*. Read-only access is enough.

### 3. Create the Node.js application

cPanel → **Setup Node.js App** → *Create Application*:

| Field | Value |
| --- | --- |
| Node.js version | **20.9 or newer** (Next.js 16 will not run below this) |
| Application mode | Production |
| Application root | `agfas` |
| Application URL | `agfasgas.com` |
| Application startup file | `server.js` |

### 4. Add the environment variables — before building

Still in *Setup Node.js App*, add each variable:

| Variable | Value |
| --- | --- |
| `WP_URL` | `https://wp.agfasgas.com` |
| `NEXT_PUBLIC_WP_URL` | `https://wp.agfasgas.com` |
| `SITE_URL` | `https://agfasgas.com` |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | your reCAPTCHA site key |
| `RECAPTCHA_SECRET_KEY` | your reCAPTCHA secret key |

> **This ordering matters.** Anything named `NEXT_PUBLIC_*` is baked into the
> JavaScript when the site is **built**, not read when it runs. Build before
> setting them and the reCAPTCHA box silently never appears.

The WooCommerce keys are deliberately absent: they are only used by
`npm run seed`, which you run on your own machine.

### 5. Install, build, start

In *Setup Node.js App*, on your application:

1. **Run NPM Install**
2. **Run JS Script** → `build`
3. **Restart**

Open `https://agfasgas.com`. If the catalogue loads, you are done.

---

## Updating the site later

After any change, from your own machine:

```bash
git add -A
git commit -m "Describe what changed"
git push
```

Then in cPanel:

1. **Git Version Control** → *Manage* → **Update from Remote** (pulls the change)
2. **Setup Node.js App** → **Run JS Script** → `build`
3. **Restart**

Skip step 1's *Run NPM Install* unless `package.json` changed.

> Only content and code changes need this. Text edited in **AGFAS Content**,
> and products edited in WooCommerce, appear on the site within about a minute
> with no deployment at all.

---

## If something goes wrong

**The site shows a 503 or a Passenger error page**
Check the application's log in *Setup Node.js App*. The usual causes are a
Node version below 20.9, or `npm run build` never having been run — there is
no `.next` folder to serve.

**The build fails with "Out of memory" or "Cannot allocate Wasm memory"**
Turbopack, which Next.js 16 uses by default, reserves more address space than
shared hosting allows — typically a 4 GB cap on "Max address space" and "Max
resident set". `npm run build` therefore uses the **Webpack** builder instead
(`next build --webpack`), which produces the same output within the limit.
`npm run build:turbo` is kept for local use, where Turbopack is faster.

If it still runs out of memory, add this environment variable in *Setup Node.js
App* and build again:

| Variable | Value |
| --- | --- |
| `NODE_OPTIONS` | `--max-old-space-size=2048` |

That stops V8 from over-committing inside a capped address space.

**Last resort: build on your own machine.** Run `npm run build` locally, zip the
`.next` folder, upload it into the application root through File Manager, and
extract it. Restart the app. You would repeat this on every code change, so
prefer the two options above.

**Forms say "Invalid domain for site key"**
Add `agfasgas.com` to the domain list for your key at
<https://www.google.com/recaptcha/admin>. Keep `localhost` listed so local
development keeps working.

**The catalogue is empty but WordPress has products**
Confirm `WP_URL` is set and has no trailing slash, and that
`https://wp.agfasgas.com/wp-json/wc/store/v1/products` returns JSON from the
server.

---

## After the first successful deploy

1. Set `AGFAS_STOREFRONT_ORIGIN` in `wordpress/agfas-headless.php` to
   `https://agfasgas.com`, and re-upload it to `wp-content/mu-plugins/`.
   **Without this, customers who pay are returned to WordPress instead of your
   own confirmation page.**
2. Add `agfasgas.com` to your reCAPTCHA key at
   <https://www.google.com/recaptcha/admin>, keeping `localhost` listed.
   Without it every form shows "Invalid domain for site key".
3. Set toyyibPay's **Category Code** in WooCommerce, or no order can complete.
4. Leave WooCommerce in **Coming soon** mode. It blocks the WordPress front
   end while leaving the REST API working, which is exactly what this
   architecture wants — customers never reach WordPress.
5. Submit `https://agfasgas.com/sitemap.xml` in Google Search Console.
6. Place one real low-value order end to end before announcing the site.
