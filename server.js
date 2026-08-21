/**
 * Entry point for cPanel's "Setup Node.js App" (Phusion Passenger).
 *
 * Passenger needs a startup file it can require; it does not run `next start`.
 * This boots the same Next.js server programmatically. Passenger supplies the
 * port through PORT and takes over the listening socket itself.
 *
 * Note: this file is NOT compiled by Next.js, so it must be plain JavaScript
 * that the host's Node version understands directly. It also cannot be
 * combined with `output: "standalone"` — that mode emits its own server.
 *
 * Run `npm run build` before starting, then restart the app in cPanel.
 */

const { createServer } = require("http");
const next = require("next");

const port = parseInt(process.env.PORT || "3000", 10);
const hostname = process.env.HOSTNAME || "0.0.0.0";

// Passenger sets NODE_ENV, but be explicit so a missing value cannot silently
// start a development server in production.
const dev = process.env.NODE_ENV === "development";

const app = next({ dev, dir: __dirname });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    createServer((req, res) => {
      handle(req, res);
    }).listen(port, hostname, () => {
      console.log(`AGFAS storefront listening on ${hostname}:${port} (dev=${dev})`);
    });
  })
  .catch((err) => {
    console.error("Failed to start the Next.js server:", err);
    process.exit(1);
  });
