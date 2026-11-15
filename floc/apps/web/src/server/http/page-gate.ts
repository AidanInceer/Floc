import type { IncomingMessage, ServerResponse } from "node:http";

import { clientKey, writeLimiter } from "./write-limiter";

type Listener = (req: IncomingMessage, res: ServerResponse) => unknown;

// Why these stay open: built files cost no render or database read, and the rest are machine calls with their own guard.
const UNCOUNTED = ["/_next/static/", "/api/health", "/api/auth/", "/api/cron/"];

/**
 * Why 600 and 10 a second (#587): one page load is a document plus the links Next fetches ahead, and a group on
 * one wifi shares an address. A flood from one address still settles at 10 requests a second.
 */
const readLimiter = () => writeLimiter({ capacity: 600, perSecond: 10 });

export function isLimitedRead(method: string | undefined, url: string | undefined): boolean {
  if (method !== "GET" && method !== "HEAD") return false;
  const path = (url ?? "/").split("?")[0];
  return !UNCOUNTED.some((prefix) => path.startsWith(prefix));
}

/** Answers 429 before Next renders anything for a caller past the read limiter. */
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
