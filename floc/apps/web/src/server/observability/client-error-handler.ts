import { clientKey, writeLimiter } from "../http/write-limiter";

import { MAX_CLIENT_ERROR_BYTES, readClientError, reportClientError } from "./client-error";

const empty = (status: number) => new Response(null, { status });

/** The body as text, or null once it passes the cap: a chunked body has no length to check first. */
async function cappedText(req: Request): Promise<string | null> {
  if (!req.body) return "";
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > MAX_CLIENT_ERROR_BYTES) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks, length).toString("utf8");
}

/**
 * Why (#613): the beacon needs no sign-in, so anyone can call it. A small per-caller bucket, on top of the write
 * limiter, keeps one tab in an error loop, or a script, from filling the logs.
 */
export function clientErrorHandler({ capacity = 10, perSecond = 0.1 } = {}) {
  const callers = writeLimiter({ capacity, perSecond, maxKeys: 5_000 });
  return async (req: Request): Promise<Response> => {
    if (Number(req.headers.get("content-length")) > MAX_CLIENT_ERROR_BYTES) {
      await req.body?.cancel();
      return empty(413);
    }
    if (!callers.allow(clientKey(req.headers.get("x-real-ip") ?? undefined, undefined) ?? "local")) return empty(429);
    const text = await cappedText(req);
    if (text === null) return empty(413);
    const report = readClientError(text);
    if (!report) return empty(400);
    reportClientError(report);
    return empty(204);
  };
}
