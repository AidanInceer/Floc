/** Why: browsers read `/\host` and `\\host` as another origin, so a leading slash alone is not enough. */
export function localPath(raw: unknown, fallback: string): string {
  if (typeof raw !== "string" || !raw.startsWith("/")) return fallback;
  return /^[/\\][/\\]/.test(raw) ? fallback : raw;
}
