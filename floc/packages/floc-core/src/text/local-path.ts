/**
 * Why: browsers read `/\host` and `\\host` as another origin, so a leading slash alone is not enough.
 * They also drop tabs and newlines from a URL before reading it, so `/\t/host` becomes `//host`.
 */
export function localPath(raw: unknown, fallback: string): string {
  if (typeof raw !== "string" || !raw.startsWith("/")) return fallback;
  if (/[\s\u0000-\u001f\u007f]/.test(raw)) return fallback;
  return /^[/\\][/\\]/.test(raw) ? fallback : raw;
}
