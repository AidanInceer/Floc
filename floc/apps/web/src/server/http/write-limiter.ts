/**
 * Why: a bound on how fast one caller can change things, ahead of Next, so a script cannot flood a trip or the
 * database. Per process, like the geocoding queue, which holds while floc-web runs as one instance. No
 * `server-only`: the custom server loads this outside Next.
 */

const MACHINE_PATHS = ["/api/auth/", "/api/billing/webhook", "/api/billing/app-store", "/api/billing/play", "/api/inbound", "/api/cron/"];
const LOOPBACK = new Set(["127.0.0.1", "::1", "::ffff:127.0.0.1"]);

type Bucket = { tokens: number; at: number };

export function writeLimiter({ capacity = 120, perSecond = 2, maxKeys = 10_000 } = {}) {
  const buckets = new Map<string, Bucket>();

  const forgetSome = (now: number) => {
    for (const [key, b] of buckets) {
      if (b.tokens + ((now - b.at) / 1000) * perSecond >= capacity) buckets.delete(key);
    }
    for (const key of buckets.keys()) {
      if (buckets.size < maxKeys) break;
      buckets.delete(key);
    }
  };

  return {
    allow(key: string, now = Date.now()): boolean {
      const held = buckets.get(key);
      const tokens = held ? Math.min(capacity, held.tokens + ((now - held.at) / 1000) * perSecond) : capacity;
      if (!held && buckets.size >= maxKeys) forgetSome(now);
      if (tokens < 1) {
        buckets.set(key, { tokens, at: now });
        return false;
      }
      buckets.set(key, { tokens: tokens - 1, at: now });
      return true;
    },
    size: () => buckets.size,
  };
}

export function isLimitedWrite(method: string | undefined, url: string | undefined): boolean {
  if (!method || method === "GET" || method === "HEAD" || method === "OPTIONS") return false;
  const path = (url ?? "/").split("?")[0];
  return !MACHINE_PATHS.some((prefix) => path.startsWith(prefix));
}

/** Null for this machine's own calls: the socket's session check and local tests are never limited. */
export function clientKey(realIp: string | string[] | undefined, remoteAddress: string | undefined): string | null {
  const edge = Array.isArray(realIp) ? realIp[0] : realIp;
  if (edge) return edge;
  if (!remoteAddress || LOOPBACK.has(remoteAddress)) return null;
  return remoteAddress;
}
