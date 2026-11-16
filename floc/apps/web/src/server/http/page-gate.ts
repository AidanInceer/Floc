import type { IncomingMessage, ServerResponse } from "node:http";

import { clientKey, writeLimiter } from "./write-limiter";

type Listener = (req: IncomingMessage, res: ServerResponse) => unknown;

const UNCOUNTED = ["/_next/static/", "/api/health", "/api/auth/", "/api/cron/"];

const readLimiter = () => writeLimiter({ capacity: 600, perSecond: 10 });

export function isLimitedRead(method: string | undefined, url: string | undefined): boolean {
  if (method !== "GET" && method !== "HEAD") return false;
  const path = (url ?? "/").split("?")[0];
  return !UNCOUNTED.some((prefix) => path.startsWith(prefix));
}

export function limitReads(handle: Listener, reads = readLimiter()): Listener {
  return (req, res) => {
    const caller = isLimitedRead(req.method, req.url) ? clientKey(req.headers["x-real-ip"], req.socket.remoteAddress) : null;
    if (caller && !reads.allow(caller)) {
      res.writeHead(429, { "Retry-After": "10", "Content-Type": "text/plain; charset=utf-8" });
      res.end("Too many requests at once. Wait a moment and try again.");
      return;
    }
    return handle(req, res);
  };
}
