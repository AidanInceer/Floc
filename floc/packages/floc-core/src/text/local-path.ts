export function localPath(raw: unknown, fallback: string): string {
  if (typeof raw !== "string" || !raw.startsWith("/")) return fallback;
  if (/[\s\u0000-\u001f\u007f]/.test(raw)) return fallback;
  return /^[/\\][/\\]/.test(raw) ? fallback : raw;
}
