import { createServer } from "node:http";

import { createNotesLive } from "./src/server/notes/live/notes-live.ts";
import { attachNotesLive } from "./src/server/notes/live/live-socket.ts";
import { sessionResolver } from "./src/server/notes/live/live-session.ts";
import { limitWrites } from "./src/server/http/write-gate.ts";
import { limitReads } from "./src/server/http/page-gate.ts";
import { setVisitorAddress, withVisitorAddress } from "./src/server/http/visitor-address.ts";
import { withRequestId } from "./src/server/http/request-id.ts";
import { log } from "./src/server/observability/log.ts";

const dev = process.argv.includes("--dev");
(process.env as Record<string, string>).NODE_ENV ??= dev ? "development" : "production";
const { default: next } = await import("next");

const port = Number(process.env.PORT ?? 3000);
(process.env as Record<string, string>).__NEXT_PRIVATE_ORIGIN ??= `http://127.0.0.1:${port}`;
const app = next({ dev, port });
await app.prepare();

const handle = app.getRequestHandler();
const server = createServer(withRequestId(withVisitorAddress(limitReads(limitWrites(handle)))));
server.on("upgrade", (req) => setVisitorAddress(req));
const live = createNotesLive({ resolveUser: sessionResolver(`http://127.0.0.1:${port}`) });
attachNotesLive(server, live, app.getUpgradeHandler());

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    live.flushPendingStores();
    live.closeConnections();
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 10_000).unref();
  });
}

server.listen(port, () => {
  log.info("floc-web ready", { port });
});
