/**
 * Vibe tags (ticket 46) — profile chips, picked like dating-app interests.
 * Seed-only, unlike free-text trip tags (ticket 71): future matching compares
 * tags across accounts, and free text would give "slow travel"/"slow
 * traveller"/"slow" to reconcile. Custom tags are deferred, not refused.
 */
import { normaliseTag } from "@/lib/tags";

/** Lower-case, as stored. Ordered pace → company → interests for the picker's on-screen grouping. */
export const VIBE_TAGS = [
  "slow travel",
  "packed itinerary",
  "spontaneous",
  "planned to the hour",
  "early starts",
  "late nights",
  "budget",
  "worth splashing out",
  "city breaks",
  "beaches",
  "mountains",
  "road trips",
  "islands",
  "camping",
  "hiking",
  "skiing",
  "diving",
  "festivals",
  "nightlife",
  "food and markets",
  "wine and breweries",
  "museums and galleries",
  "history and ruins",
  "wildlife",
  "photography",
  "big groups",
  "small groups",
  "family friendly",
  "solo-ish",
] as const;

/** Beyond this the chip row is a wall, not a summary. */
export const MAX_VIBE_TAGS = 10;

/** Form input → the column. Seed-only enforced here too, not just in the UI — a hand-crafted POST must not invent a tag. */
export function parseVibeTags(input: (string | null | undefined)[]): string[] {
  const allowed = new Set<string>(VIBE_TAGS);
  const out: string[] = [];
  for (const raw of input) {
    if (typeof raw !== "string") continue;
    const tag = normaliseTag(raw);
    if (!allowed.has(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length >= MAX_VIBE_TAGS) break;
  }
  return out;
}

/** Same degrade-don't-crash contract as `readTags` (rule 11), plus the seed filter — a retired tag just stops rendering. */
export function readVibeTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const allowed = new Set<string>(VIBE_TAGS);
  return value.filter(
    (t): t is string => typeof t === "string" && allowed.has(t),
  );
}
