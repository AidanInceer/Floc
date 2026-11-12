import type { IncomingMessage, ServerResponse } from "node:http";

import { log } from "../observability/log";
import { requestIdFrom, withRequestContext } from "../observability/request-context";
import { routePattern } from "../observability/route-pattern";

type Listener = (req: IncomingMessage, res: ServerResponse) => unknown;

// Why (#613): Railway's HTTP logs already hold every request's path, status and time, so only slow ones get a line.
const SLOW_MS = 2_000;

/** Runs each request inside its id — the edge's `X-Railway-Request-Id` when sent — so every log line carries it. */
export function withRequestId(handle: Listener, now: () => number = performance.now.bind(performance)): Listener {
  return (req, res) => {
    const requestId = requestIdFrom(req.headers["x-railway-request-id"]);
    const started = now();
    res.setHeader("X-Request-Id", requestId);
    res.once("finish", () => {
      const ms = Math.round(now() - started);
      if (ms < SLOW_MS) return;
      const fields = { route: routePattern(req.url), method: req.method, status: res.statusCode, ms };
      withRequestContext({ requestId }, () => log.warn("request.slow", fields));
    });
    return withRequestContext({ requestId }, () => handle(req, res));
  };
}
