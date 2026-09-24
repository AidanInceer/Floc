/**
 * Trip tags (#71) — free text, normalised so the same label typed two ways is one tag on the
 * /trips filter. Every writer runs its input through `parseTags`, so nothing unnormalised is stored.
 */

const TAG_SEPARATOR = ", ";

// Why: beyond this a trip card is a wall of pills, not a label.
export const MAX_TAGS = 5;
export const MAX_TAG_LENGTH = 24;

// Why: order is what the author typed — first mention wins, so re-saving never shuffles the pills.
export function parseTags(input: string | null | undefined): string[] {
  if (!input) return [];
  const seen = new Set<string>();
  for (const raw of input.split(",")) {
    const tag = normaliseTag(raw);
    if (!tag) continue;
    seen.add(tag);
    if (seen.size >= MAX_TAGS) break;
  }
  return [...seen];
}

export function normaliseTag(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, " ").slice(0, MAX_TAG_LENGTH);
}

export function formatTags(tags: string[] | null | undefined): string {
  return (tags ?? []).join(TAG_SEPARATOR);
}

// Why: `tags` is JSON, so a hand-edited row — or one written before the column existed — can hold
// anything at all. Rule 11.
export function readTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((t): t is string => typeof t === "string" && t.length > 0)
    .slice(0, MAX_TAGS); // rows saved under the old limit of eight hold more
}

// Why: one name per row, no colour — the whole trip wears one chosen pastel (#213), so a tag is
// just its text, and a blank row deletes it.
export function parseTagNames(names: string[]): string[] {
  const tags: string[] = [];
  for (const name of names) {
    const tag = normaliseTag(name);
    if (!tag || tags.includes(tag)) continue;
    tags.push(tag);
    if (tags.length >= MAX_TAGS) break;
  }
  return tags;
}
