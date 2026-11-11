/**
 * floc-web's entry (#391): Next.js and the live Notes socket on one port.
 * Runs under Node's type stripping with the alias loader, like the seed.
 */
import { createServer } from "node:http";

import { createNotesLive } from "./src/server/notes/live/notes-live.ts";
import { attachNotesLive } from "./src/server/notes/live/live-socket.ts";
import { sessionResolver } from "./src/server/notes/live/live-session.ts";
import { limitWrites } from "./src/server/http/write-gate.ts";
import { withRequestId } from "./src/server/http/request-id.ts";
import { log } from "./src/server/observability/log.ts";

const dev = process.argv.includes("--dev");
// Why before importing next: it reads NODE_ENV at load, and `next start` used to set it.
(process.env as Record<string, string>).NODE_ENV ??= dev ? "development" : "production";
const { default: next } = await import("next");

const port = Number(process.env.PORT ?? 3000);
// Why: after an action's redirect Next fetches the target from itself, over https when Railway says the caller used
// https, and this server speaks plain http. Next falls back without the fetch, so this only saves a round trip.
(process.env as Record<string, string>).__NEXT_PRIVATE_ORIGIN ??= `http://127.0.0.1:${port}`;
const app = next({ dev, port });
await app.prepare();

const handle = app.getRequestHandler();
const server = createServer(withRequestId(limitWrites(handle)));
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
  log.info("floc-web ready", { port });
});
