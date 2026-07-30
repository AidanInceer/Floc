/**
 * Trip tags (ticket 71) — free text, normalised here so the same label typed
 * two ways in two trips is still one tag on the /trips filter.
 *
 * Pure, no DB access: `trip.tags` is a JSON column and every writer runs its
 * input through `parseTags` first, so nothing unnormalised reaches the row.
 */

/** Comma-separated in the field, an array in the column. */
export const TAG_SEPARATOR = ", ";

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

/* -------------------------------------------------------------------------- */
/* Tag colour (ticket 86)                                                     */
/* -------------------------------------------------------------------------- */

/**
 * A tag's colour is a `Badge` tone, not a new colour system (ticket 86): the
 * five tones are already the only palette a pill is allowed to wear, so a
 * picker over them can't produce a badge that looks foreign. Their names here
 * are what the colour *looks like*, because a tag's meaning is the group's, not
 * ours — "beach" is not "agreed".
 *
 * Per-trip, not per-account: `tags` is a trip column and the vocabulary is a
 * private joke per group (ticket 71), so a shared palette would need a table
 * and would make one group's "beach" recolour another's.
 */
export const TAG_TONES = {
  open: "Yellow",
  agreed: "Green",
  marine: "Blue",
  action: "Red",
  neutral: "Plain",
} as const;

export type TagTone = keyof typeof TAG_TONES;

/** What an uncoloured tag wears — the pill colour tags had before ticket 86. */
export const DEFAULT_TAG_TONE: TagTone = "open";

function isTagTone(value: unknown): value is TagTone {
  return typeof value === "string" && value in TAG_TONES;
}

/**
 * tag → tone, read off the JSON column. Same degrade-don't-crash contract as
 * `readTags`: anything unrecognised simply isn't there, and a tag with no entry
 * falls back to `DEFAULT_TAG_TONE` at render.
 */
export function readTagTones(value: unknown): Record<string, TagTone> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: Record<string, TagTone> = {};
  for (const [tag, tone] of Object.entries(value as Record<string, unknown>)) {
    if (isTagTone(tone)) out[tag] = tone;
  }
  return out;
}

export function tagTone(
  tones: Record<string, TagTone>,
  tag: string,
): TagTone {
  return tones[tag] ?? DEFAULT_TAG_TONE;
}

/**
 * A tag save from the row editor (ticket 86): one name and one colour per row,
 * in the same order. Rows are the unit because that's what the editor shows —
 * a name beside its colour, deleted together — so nothing has to re-associate
 * a colour with a tag whose text was just edited.
 *
 * Same normalisation and caps as `parseTags`; a blank row is how a tag is
 * deleted, and the default colour isn't stored, so a trip nobody has recoloured
 * keeps an empty map rather than a row per tag.
 */
export function parseTagRows(
  rows: { name: string; tone: string }[],
): { tags: string[]; tagTones: Record<string, TagTone> } {
  const tags: string[] = [];
  const tagTones: Record<string, TagTone> = {};
  for (const row of rows) {
    const tag = normaliseTag(row.name);
    if (!tag || tags.includes(tag)) continue;
    tags.push(tag);
    if (isTagTone(row.tone) && row.tone !== DEFAULT_TAG_TONE) {
      tagTones[tag] = row.tone;
    }
    if (tags.length >= MAX_TAGS) break;
  }
  return { tags, tagTones };
}
