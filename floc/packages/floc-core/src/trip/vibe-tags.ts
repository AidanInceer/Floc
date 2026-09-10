/**
 * Vibe tags (ticket 46) — profile chips, picked like dating-app interests.
 * Seed-only, unlike free-text trip tags (ticket 71): future matching compares
 * tags across accounts, and free text would give "slow travel"/"slow
 * traveller"/"slow" to reconcile. Custom tags are deferred, not refused.
 */
import { normaliseTag } from "./tags";

/**
 * Lower-case, as stored. Cut from thirty to five (ticket 201 follow-up)
 * because the wall read as a survey, then back up to ten (ticket 236) — five
 * was too few to say anything about a person, and matching across accounts
 * still works while the list is short enough to read at a glance.
 */
export const VIBE_TAGS = [
  "early starts",
  "late nights",
  "city breaks",
  "beaches",
  "road trips",
  "hiking",
  "food first",
  "museums",
  "festivals",
  "slow mornings",
] as const;

/** Form input → the column. Seed-only enforced here too, not just in the UI — a hand-crafted POST must not invent a tag. */
export function parseVibeTags(input: (string | null | undefined)[]): string[] {
  const allowed = new Set<string>(VIBE_TAGS);
  const out: string[] = [];
  for (const raw of input) {
    if (typeof raw !== "string") continue;
    const tag = normaliseTag(raw);
    if (!allowed.has(tag) || out.includes(tag)) continue;
    out.push(tag);
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
