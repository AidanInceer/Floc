import type { IncomingMessage, ServerResponse } from "node:http";

import { log } from "../observability/log";
import { requestIdFrom, withRequestContext } from "../observability/request-context";
import { routePattern } from "../observability/route-pattern";

type Listener = (req: IncomingMessage, res: ServerResponse) => unknown;

const SLOW_MS = 2_000;

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
