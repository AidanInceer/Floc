export const NONCE_HEADER = "x-nonce";

type Options = {
  nonce: string | null;
  host: string | null;
  dev: boolean;
  maps?: boolean;
};

const GOOGLE_MAP = {
  script: ["https://maps.googleapis.com"],
  img: ["https://*.googleapis.com", "https://*.gstatic.com", "https://*.google.com", "https://*.googleusercontent.com"],
  connect: ["https://*.googleapis.com", "https://*.google.com", "https://*.gstatic.com"],
  style: ["https://fonts.googleapis.com"],
  font: ["https://fonts.gstatic.com"],
};
const NO_MAP: typeof GOOGLE_MAP = { script: [], img: [], connect: [], style: [], font: [] };

function socketsOf(host: string | null, dev: boolean): string[] {
  if (!host) return [];
  return dev ? [`ws://${host}`, `wss://${host}`] : [`wss://${host}`];
}

export function contentSecurityPolicy({ nonce, host, dev, maps = false }: Options): string {
  const script = nonce ? `'nonce-${nonce}' 'strict-dynamic'` : "'unsafe-inline'";
  const map = maps ? GOOGLE_MAP : NO_MAP;
  return [
    "default-src 'self'",
    [`script-src 'self' ${script}${dev ? " 'unsafe-eval'" : ""}`, ...map.script].join(" "),
    ["style-src 'self' 'unsafe-inline'", ...map.style].join(" "),
    ["img-src 'self' data: blob:", ...map.img].join(" "),
    "media-src 'self' blob:",
    ["font-src 'self'", ...map.font].join(" "),
    ["connect-src 'self'", ...socketsOf(host, dev), ...map.connect].join(" "),
    "worker-src 'self' blob:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "object-src 'none'",
    "form-action 'self'",
  ].join("; ");
}
