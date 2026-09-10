/**
 * Trip tags (ticket 71) — free text, normalised here so the same label typed
 * two ways in two trips is still one tag on the /trips filter.
 *
 * Pure, no DB access: `trip.tags` is a JSON column and every writer runs its
 * input through `parseTags` first, so nothing unnormalised reaches the row.
 */

/** Comma-separated in the field, an array in the column. */
const TAG_SEPARATOR = ", ";

/** Beyond this a trip card is a wall of pills, not a label. */
export const MAX_TAGS = 8;
export const MAX_TAG_LENGTH = 24;

/**
 * Lower-cases, trims, collapses inner whitespace, drops blanks and duplicates,
 * and caps both the count and each tag's length. Order is what the author
 * typed — first mention wins, so re-saving doesn't shuffle the pills.
 */
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

/** One tag's text, as it's stored: lower-case, single-spaced, length-capped. */
export function normaliseTag(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, " ").slice(0, MAX_TAG_LENGTH);
}

/** The column back into the text field. */
export function formatTags(tags: string[] | null | undefined): string {
  return (tags ?? []).join(TAG_SEPARATOR);
}

/**
 * Guards the read side too: `tags` is JSON, so a hand-edited row (or one
 * written before this column existed) can be anything at all. Rule 11 —
 * degrade, don't crash.
 */
export function readTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((t): t is string => typeof t === "string" && t.length > 0);
}

/**
 * A tag save from the row editor: one name per row. Colour is no longer
 * per-tag — the whole trip wears one chosen pastel (ticket 213), so a tag is
 * just its text. A blank row deletes a tag; normalisation drops dupes and caps
 * the count.
 */
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
