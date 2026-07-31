/**
 * Vibe tags (ticket 46) — the chips on your profile, picked like interests on
 * a dating profile.
 *
 * **Seed-only.** Unlike trip tags (ticket 71), whose vocabulary is a private
 * joke per group and so is deliberately free text, these are one shared
 * vocabulary across every account: later matching features compare one
 * person's tags with another's, and free text would give them "slow travel",
 * "slow traveller" and "slow" to reconcile. Custom tags are deferred, not
 * refused — when they land, this list stays as the suggestions.
 *
 * Pure, no DB access: `user_profile.vibe_tags` is a JSON column and every
 * writer runs its input through `parseVibeTags` first.
 */
import { normaliseTag } from "@/lib/tags";

/**
 * The pickable set. Lower-case because that's how tags are stored; the UI
 * capitalises nothing — a chip reads as a label, not a heading. Ordered
 * roughly pace → company → interests, which is how the picker groups on screen
 * without needing a group per row.
 */
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

/**
 * Form input → the column. Seed-only is enforced *here*, not just in the UI:
 * the picker posts checkbox values, and a hand-crafted POST must not be able to
 * invent a tag the vocabulary doesn't have.
 */
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

/**
 * The column back into a list. Same degrade-don't-crash contract as
 * `readTags` (rule 11), plus the seed filter — a tag retired from `VIBE_TAGS`
 * simply stops rendering rather than leaving a chip nothing can explain.
 */
export function readVibeTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const allowed = new Set<string>(VIBE_TAGS);
  return value.filter(
    (t): t is string => typeof t === "string" && allowed.has(t),
  );
}
