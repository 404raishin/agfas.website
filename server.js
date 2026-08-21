/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Entry point for cPanel's "Setup Node.js App" (Phusion Passenger).
 *
 * Passenger needs a startup file it can require; it does not run `next start`.
 * This boots the same Next.js server programmatically. Passenger supplies the
 * port through PORT and takes over the listening socket itself.
 *
 * Not compiled by Next.js, so it must be plain CommonJS the host's Node
 * understands directly. Cannot be combined with `output: "standalone"`.
 *
 * Run `npm run build` before starting, then restart the app in cPanel.
 */

const { createServer } = require("http");
const next = require("next");

const port = parseInt(process.env.PORT || "3000", 10);

/*
 * Fail safe to production. Testing `NODE_ENV !== "production"` would start a
 * development server whenever the variable is unset or misspelled — on a host
 * with no dev dependencies installed and no dev build, that fails outright.
 * Development has to be asked for explicitly.
 */
const dev = process.env.NODE_ENV === "development";

// Resolved from this file rather than the working directory, which Passenger
// does not guarantee.
const app = next({ dev, dir: __dirname });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    createServer((req, res) => {
      handle(req, res);
    }).listen(port, () => {
      console.log(`AGFAS storefront ready on port ${port} (dev=${dev})`);
    });
  })
  .catch((err) => {
    console.error("Failed to start the Next.js server:", err);
    process.exit(1);
  });
