/**
 * Why: a notes link arrives from a paste, from another editor over the live
 * socket, or from stored JSON, and any of them can carry `javascript:`. Only
 * these schemes are ever kept, wherever a link is read or drawn.
 */
const SAFE = /^(https?:|mailto:|tel:)/i;

export function safeHref(raw: string): string | null {
  // Browsers drop tabs and newlines inside a scheme, so `java\tscript:` runs.
  const href = raw.trim();
  if (/[\u0000-\u001f]/.test(href)) return null;
  return SAFE.test(href) ? href : null;
}
