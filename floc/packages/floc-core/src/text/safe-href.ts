const SAFE = /^(https?:|mailto:|tel:)/i;

export function safeHref(raw: string): string | null {
  const href = raw.trim();
  if (/[\u0000-\u001f]/.test(href)) return null;
  return SAFE.test(href) ? href : null;
}
