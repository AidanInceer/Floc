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

  const tokensNow = (b: Bucket, now: number) => Math.min(capacity, b.tokens + ((now - b.at) / 1000) * perSecond);

  // Why: dropping whichever key came first let a flood of new addresses wipe the bucket of a caller being refused.
  // The caller with most credit loses least by starting again.
  const forgetSome = (now: number) => {
    let richest: string | null = null;
    let most = -Infinity;
    for (const [key, b] of buckets) {
      const tokens = tokensNow(b, now);
      if (tokens >= capacity) buckets.delete(key);
      else if (tokens > most) [richest, most] = [key, tokens];
    }
    if (buckets.size >= maxKeys && richest !== null) buckets.delete(richest);
  };

  return {
    allow(key: string, now = Date.now()): boolean {
      const held = buckets.get(key);
      const tokens = held ? tokensNow(held, now) : capacity;
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
  if (edge) return network(edge);
  if (!remoteAddress || LOOPBACK.has(remoteAddress)) return null;
  return network(remoteAddress);
}

/** Why: one caller holds a whole IPv6 /64, so counting single addresses gave them 2^64 buckets. IPv4 stays as it is. */
function network(address: string): string {
  const ip = address.split("%")[0].toLowerCase();
  if (!ip.includes(":")) return ip;
  const mapped = /^::ffff:(d+.d+.d+.d+)$/.exec(ip);
  if (mapped) return mapped[1];
  const halves = ip.split("::");
  const left = halves[0] ? halves[0].split(":") : [];
  const right = halves[1] ? halves[1].split(":") : [];
  const groups = halves.length === 1 ? left : [...left, ...Array<string>(Math.max(0, 8 - left.length - right.length)).fill("0"), ...right];
  return `${groups.slice(0, 4).map((g) => (Number.parseInt(g, 16) || 0).toString(16)).join(":")}::/64`;
}
