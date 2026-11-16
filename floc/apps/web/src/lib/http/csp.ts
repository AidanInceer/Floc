export const NONCE_HEADER = "x-nonce";

type Options = {
  nonce: string | null;
  host: string | null;
  dev: boolean;
};

function socketsOf(host: string | null, dev: boolean): string[] {
  if (!host) return [];
  return dev ? [`ws://${host}`, `wss://${host}`] : [`wss://${host}`];
}

export function contentSecurityPolicy({ nonce, host, dev }: Options): string {
  const script = nonce ? `'nonce-${nonce}' 'strict-dynamic'` : "'unsafe-inline'";
  return [
    "default-src 'self'",
    `script-src 'self' ${script}${dev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    ["connect-src 'self'", ...socketsOf(host, dev)].join(" "),
    "worker-src 'self' blob:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "object-src 'none'",
    "form-action 'self'",
  ].join("; ");
}
