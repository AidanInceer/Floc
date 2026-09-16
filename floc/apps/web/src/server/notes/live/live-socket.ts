import type { IncomingMessage, Server } from "node:http";

import type { Hocuspocus } from "@hocuspocus/server";
import { WebSocketServer } from "ws";

export const LIVE_NOTES_PATH = "/live/notes";


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
    if (new URL(req.url ?? "/", "http://x").pathname !== LIVE_NOTES_PATH) {
      if (fallback) fallback(req, socket, head);
      else socket.destroy();
      return;
    }
    sockets.handleUpgrade(req, socket, head, (ws) => {
      const client = live.handleConnection(ws, toRequest(req));
      ws.on("message", (data: Buffer) => client.handleMessage(new Uint8Array(data)));
      ws.on("close", (code, reason) => client.handleClose({ code, reason: reason.toString() }));
    });
  });
}

