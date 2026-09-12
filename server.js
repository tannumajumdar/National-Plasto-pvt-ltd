/**
 * Startup file for Phusion Passenger — the process manager behind cPanel's
 * "Setup Node.js App".
 *
 * Passenger starts one file and hands it a port; Next.js ships no such entry
 * point, so this is the shim between them. Everything else — routing, server
 * components, the API routes — is Next's own request handler.
 *
 * Not used anywhere else: `npm run dev` and `npm start` go through the Next
 * CLI as usual, and Railway ignores this file entirely.
 *
 * CommonJS on purpose. Passenger loads this directly rather than through the
 * package's module resolution, so ESM syntax fails here.
 */
const { createServer } = require("http");
const next = require("next");

const app = next({ dev: false });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => handle(req, res)).listen(process.env.PORT || 3000);
});
