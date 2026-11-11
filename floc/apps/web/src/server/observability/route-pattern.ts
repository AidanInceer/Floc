const MASK_AFTER: Record<string, string> = {
  trip: "[id]",
  files: "[docId]",
  profile: "[userId]",
  invite: "[token]",
  calendar: "[token]",
};
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_LENGTH = 200;

function maskSegment(segment: string, previous: string | undefined): string {
  const named = previous && MASK_AFTER[previous];
  if (named && segment) return named;
  if (/^\d+$/.test(segment)) return "[n]";
  if (UUID.test(segment)) return "[id]";
  if (segment.length >= 20) return "[token]";
  return segment;
}

/** A request path as its route, with no query and no ids or tokens (#613: logs hold no personal data). */
export function routePattern(url: string | undefined): string {
  const segments = (url ?? "/").split(/[?#]/)[0]!.split("/");
  const masked = segments.map((segment, i) => maskSegment(segment, segments[i - 1]));
  return (masked.join("/") || "/").slice(0, MAX_LENGTH);
}
