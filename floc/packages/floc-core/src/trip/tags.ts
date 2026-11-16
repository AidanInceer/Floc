export const MAX_TAGS = 5;
export const MAX_TAG_LENGTH = 24;

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

export function readTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((t): t is string => typeof t === "string" && t.length > 0)
    .slice(0, MAX_TAGS);
}

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
