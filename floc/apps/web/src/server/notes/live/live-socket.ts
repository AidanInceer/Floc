import type { IncomingMessage, Server } from "node:http";

import type { Hocuspocus } from "@hocuspocus/server";
import { WebSocketServer } from "ws";

export const LIVE_NOTES_PATH = "/live/notes";

const FORBIDDEN = ["HTTP/1.1 403 Forbidden", "Connection: close", "", ""].join("\r\n");

const TRUSTED_ORIGINS = [process.env.BETTER_AUTH_URL, process.env.FLOC_LAN_ORIGIN].flatMap((raw) => {
  try {
    return raw ? [new URL(raw).origin] : [];
  } catch {
    return [];
  }
});

/**
 * Why: a page on another site can open a socket with the visitor's cookie, so a browser's Origin must be ours.
 * A native app sends none, or its own server's; both pass.
 */
function fromOurOrigin(req: IncomingMessage): boolean {
  const origin = req.headers.origin;
  if (!origin) return true;
  let host: string;
  try {
    host = new URL(origin).host;
  } catch {
    return false;
  }
  const ours = [req.headers["x-forwarded-host"], req.headers.host].flat().filter(Boolean);
  return ours.includes(host) || TRUSTED_ORIGINS.includes(origin);
}

function toRequest(req: IncomingMessage): Request {
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (typeof value === "string") headers.set(key, value);
    else if (value) headers.set(key, value.join(", "));
  }
  return new Request(`http://${req.headers.host ?? "localhost"}${req.url ?? "/"}`, { headers });
}

/** Every other upgrade (Next's dev reload socket) goes to `fallback`. */
export function attachNotesLive(
  server: Server,
  live: Hocuspocus,
  fallback?: (req: IncomingMessage, socket: import("node:stream").Duplex, head: Buffer) => unknown,
): void {
  const sockets = new WebSocketServer({ noServer: true, maxPayload: 2 * 1024 * 1024 });
  server.on("upgrade", (req, socket, head) => {
    if ((req.url ?? "/").split("?")[0] !== LIVE_NOTES_PATH) {
      if (fallback) fallback(req, socket, head);
      else socket.destroy();
      return;
    }
    if (!fromOurOrigin(req)) {
      socket.end(FORBIDDEN);
      return;
    }
    sockets.handleUpgrade(req, socket, head, (ws) => {
      const client = live.handleConnection(ws, toRequest(req));
      ws.on("message", (data: Buffer) => client.handleMessage(new Uint8Array(data)));
      ws.on("close", (code, reason) => client.handleClose({ code, reason: reason.toString() }));
    });
  });
}
