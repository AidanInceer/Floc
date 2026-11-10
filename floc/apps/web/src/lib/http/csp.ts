export const NONCE_HEADER = "x-nonce";

type Options = {
  /** Null where no middleware runs (a file, an API answer): those carry no page, so inline stays allowed. */
  nonce: string | null;
  host: string | null;
  dev: boolean;
};

function socketsOf(host: string | null, dev: boolean): string[] {
  if (!host) return [];
  return dev ? [`ws://${host}`, `wss://${host}`] : [`wss://${host}`];
}

/**
 * Why: scripts, connections, images and frames from Floc only, and on a page only scripts that carry the
 * response's nonce, so injected markup cannot run or send data out (#582). Styles stay inline: React writes
 * `style` attributes, which a nonce cannot cover. No imports: `next.config.ts` loads this file too.
 */
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
