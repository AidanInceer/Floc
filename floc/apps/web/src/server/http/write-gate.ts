import type { IncomingMessage, ServerResponse } from "node:http";

import { clientKey, isLimitedWrite, writeLimiter } from "./write-limiter";

type Listener = (req: IncomingMessage, res: ServerResponse) => unknown;

/** Answers 429 before Next sees a write from a caller past the write limiter. */
export function limitWrites(handle: Listener, writes = writeLimiter()): Listener {
  return (req, res) => {
    const caller = isLimitedWrite(req.method, req.url) ? clientKey(req.headers["x-real-ip"], req.socket.remoteAddress) : null;
    if (caller && !writes.allow(caller)) {
      res.writeHead(429, { "Retry-After": "30", "Content-Type": "text/plain; charset=utf-8" });
      res.end("Too many changes at once. Wait a moment and try again.");
      return;
    }
    return handle(req, res);
  };
}
