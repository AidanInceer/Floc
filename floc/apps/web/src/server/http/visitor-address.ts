import type { IncomingMessage, ServerResponse } from "node:http";

type Listener = (req: IncomingMessage, res: ServerResponse) => unknown;

const REAL_IP = "x-real-ip";
const CLOUDFLARE_IP = "cf-connecting-ip";

const CLOUDFLARE_V4 = [
  "173.245.48.0/20", "103.21.244.0/22", "103.22.200.0/22", "103.31.4.0/22", "141.101.64.0/18", "108.162.192.0/18",
  "190.93.240.0/20", "188.114.96.0/20", "197.234.240.0/22", "198.41.128.0/17", "162.158.0.0/15", "104.16.0.0/13",
  "104.24.0.0/14", "172.64.0.0/13", "131.0.72.0/22",
].map(range);
const CLOUDFLARE_V6 = [
  "2400:cb00::/32", "2606:4700::/32", "2803:f800::/32", "2405:b500::/32", "2405:8100::/32", "2a06:98c0::/29",
  "2c0f:f248::/32",
].map(range);

type Range = { start: number; bits: number };

function range(cidr: string): Range {
  const [address, bits] = cidr.split("/");
  return { start: (address.includes(":") ? v6Head(address) : v4(address)) ?? 0, bits: Number(bits) };
}

function v4(address: string): number | null {
  const parts = address.split(".");
  if (parts.length !== 4) return null;
  let value = 0;
  for (const part of parts) {
    const n = Number(part);
    if (!/^\d{1,3}$/.test(part) || n > 255) return null;
    value = value * 256 + n;
  }
  return value;
}

function v6Head(address: string): number | null {
  const left = address.split("::")[0].split(":").filter(Boolean);
  if (!address.includes("::") && address.split(":").length !== 8) return null;
  const groups = [left[0] ?? "0", left[1] ?? "0"].map((g) => (/^[0-9a-f]{1,4}$/.test(g) ? Number.parseInt(g, 16) : NaN));
  if (groups.some(Number.isNaN)) return null;
  return groups[0] * 65_536 + groups[1];
}

const within = (value: number, { start, bits }: Range) => Math.floor(value / 2 ** (32 - bits)) === Math.floor(start / 2 ** (32 - bits));

export function fromCloudflare(address: string): boolean {
  const ip = address.split("%")[0].toLowerCase().replace(/^::ffff:(?=\d+\.)/, "");
  const [value, ranges] = ip.includes(":") ? [v6Head(ip), CLOUDFLARE_V6] : [v4(ip), CLOUDFLARE_V4];
  return value !== null && ranges.some((r) => within(value, r));
}

const first = (header: string | string[] | undefined) => (Array.isArray(header) ? header[0] : header);

export function visitorAddress({ realIp, edgeIp, edge }: { realIp: string | undefined; edgeIp: string | undefined; edge: string | undefined }): string | undefined {
  if (edge === "cloudflare" && realIp && edgeIp && fromCloudflare(realIp)) return edgeIp;
  return realIp;
}

export function setVisitorAddress(req: IncomingMessage, edge = process.env.FLOC_EDGE): void {
  if (!edge) return;
  const visitor = visitorAddress({ realIp: first(req.headers[REAL_IP]), edgeIp: first(req.headers[CLOUDFLARE_IP]), edge });
  if (visitor) req.headers[REAL_IP] = visitor;
}

export function withVisitorAddress(handle: Listener, edge = process.env.FLOC_EDGE): Listener {
  return (req, res) => {
    setVisitorAddress(req, edge);
    return handle(req, res);
  };
}
