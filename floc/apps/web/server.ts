/**
 * floc-web's entry (#391): Next.js and the live Notes socket on one port.
 * Runs under Node's type stripping with the alias loader, like the seed.
 */
import { createServer } from "node:http";

import { createNotesLive } from "./src/server/notes/live/notes-live.ts";
import { attachNotesLive } from "./src/server/notes/live/live-socket.ts";
import { sessionResolver } from "./src/server/notes/live/live-session.ts";

const dev = process.argv.includes("--dev");
// Why before importing next: it reads NODE_ENV at load, and `next start` used to set it.
(process.env as Record<string, string>).NODE_ENV ??= dev ? "development" : "production";
const { default: next } = await import("next");

const port = Number(process.env.PORT ?? 3000);
const app = next({ dev, port });
await app.prepare();

const handle = app.getRequestHandler();
const server = createServer((req, res) => handle(req, res));
const live = createNotesLive({ resolveUser: sessionResolver(`http://127.0.0.1:${port}`) });
attachNotesLive(server, live, app.getUpgradeHandler());

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    live.flushPendingStores();
    live.closeConnections();
    server.close(() => process.exit(0));
    // Why: a socket that will not close holds `close` open; give the page stores time, then go.
    setTimeout(() => process.exit(0), 10_000).unref();
  });
}

server.listen(port, () => {
  console.log(`floc-web ready on http://localhost:${port}`);
});
