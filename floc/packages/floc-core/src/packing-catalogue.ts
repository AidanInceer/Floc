/**
 * What to pack, worked out rather than typed (ticket 221, parent 154). Pure —
 * the aggregate, the tests and any later "what would you suggest?" all ask this
 * one function, so the list can never differ between them.
 *
 * Three inputs, in decreasing order of how much they change the answer: how
 * many nights (sizes the counts), the weather (adds or drops whole items), and
 * the tier (nudges the counts up or down). Every one of them is allowed to be
 * missing — an undated trip still gets a list, just a generic one (rule 11).
 */
import type { PackTier } from "./packing";
import { clampPackQuantity, MAX_PACK_QUANTITY } from "./packing";
import type { PackCategory } from "./packing";
import type { WeatherCondition } from "./weather";

/**
 * The forecast boiled down to the only three questions the catalogue asks.
 * Not exclusive: a week can be both hot and wet, and both answers matter.
 */
export type PackClimate = { hot: boolean; cold: boolean; wet: boolean };

export type PackContext = {
  /** Nights away, or null when the trip has no dates yet (rule 9). */
  nights: number | null;
  /** Null when there's no forecast — no dates, no place, or beyond the horizon. */
  climate: PackClimate | null;
  tier: PackTier;
};

export type PackSuggestion = {
  label: string;
  quantity: number;
  category: PackCategory;
};

/**
 * Weather thresholds in °C. Deliberately generous: a suggestion that shows up
 * on a borderline day costs one click to delete, where a missing rain jacket
 * costs a wet week.
 */
const HOT_ABOVE = 22;
const COLD_BELOW = 9;

/** Comfort packs more of the same things; Light packs fewer. Never new kinds. */
const TIER_SCALE: Record<PackTier, number> = {
  light: 0.7,
  balanced: 1,
  comfort: 1.3,
};

type Item = {
  label: string;
  /** The heading it files under (ticket 229). */
  category: PackCategory;
  /** One per this many nights, rounded up. Omitted = a fixed `base`. */
  perNights?: number;
  /** Flat count, before any spare. */
  base?: number;
  /** Added after the per-night maths and never scaled — one spare is one spare. */
  spare?: number;
  /**
   * Ceiling at Balanced, so a month away doesn't ask for 30 pairs of jeans.
   * Scaled by the tier like everything else, or Comfort would be Balanced on
   * any trip long enough for the cap to bite — a tier control that changes
   * nothing is worse than no tier control.
   */
  cap?: number;
  /** Skipped when this says no. Absent = always packed. */
  needs?: (climate: PackClimate) => boolean;
};

/**
 * The core of anyone's bag, in the order a person packs one: clothes, then
 * washbag, then the things you'd be stuck without. Short on purpose — a list
 * you skim and add to beats one you have to prune.
 *
 * Passport and adapter are unconditional because "abroad" is not a fact the app
 * holds: there's no home country on a profile to compare a trip against, and
 * guessing it from a currency would be wrong for anyone who travels. One
 * deletable row beats a silently missing passport.
 */
const CATALOGUE: Item[] = [
  { label: "underwear", category: "clothes", perNights: 1, spare: 1, cap: 14 },
  { label: "socks", category: "clothes", perNights: 1, spare: 1, cap: 14 },
  { label: "t-shirt", category: "clothes", perNights: 1, cap: 10 },
  { label: "trousers", category: "clothes", perNights: 3, cap: 4 },
  { label: "shorts", category: "clothes", perNights: 3, cap: 4, needs: (c) => c.hot },
  { label: "jumper", category: "clothes", base: 1, needs: (c) => !c.hot || c.cold },
  { label: "warm coat", category: "clothes", base: 1, needs: (c) => c.cold },
  { label: "rain jacket", category: "clothes", base: 1, needs: (c) => c.wet },
  { label: "swimwear", category: "clothes", base: 1, needs: (c) => c.hot },
  { label: "sleepwear", category: "clothes", base: 1 },
  { label: "spare shoes", category: "clothes", base: 1 },

  { label: "toothbrush", category: "toiletries", base: 1 },
  { label: "toothpaste", category: "toiletries", base: 1 },
  { label: "shampoo", category: "toiletries", base: 1 },
  { label: "deodorant", category: "toiletries", base: 1 },
  { label: "any medication", category: "toiletries", base: 1 },
  { label: "sun cream", category: "toiletries", base: 1, needs: (c) => c.hot },

  { label: "passport", category: "essentials", base: 1 },
  { label: "wallet and cards", category: "essentials", base: 1 },
  { label: "phone", category: "essentials", base: 1 },
  { label: "phone charger", category: "essentials", base: 1 },
  { label: "keys", category: "essentials", base: 1 },
  { label: "travel adapter", category: "essentials", base: 1 },

  { label: "sunglasses", category: "accessories", base: 1, needs: (c) => c.hot },
  { label: "water bottle", category: "accessories", base: 1 },
  { label: "day bag", category: "accessories", base: 1 },
];

/** No forecast means no opinion, not a guess — every weather item sits out. */
const NO_CLIMATE: PackClimate = { hot: false, cold: false, wet: false };

/**
 * What the forecast means for a bag. Any single hot day earns shorts and any
 * single wet one earns a jacket: you pack for the worst day of the trip, not
 * the average of them.
 */
export function summariseClimate(
  days: { condition: WeatherCondition; hi: number; lo: number }[],
): PackClimate | null {
  if (days.length === 0) return null;
  return {
    hot: days.some((d) => d.hi >= HOT_ABOVE),
    cold: days.some((d) => d.lo <= COLD_BELOW),
    wet: days.some((d) => d.condition === "rain"),
  };
}

/**
 * The suggested bag. An undated trip falls back to one night's worth, which is
 * the generic starter list the ticket asks for — same items, smallest counts.
 */
export function generatePackingList(ctx: PackContext): PackSuggestion[] {
  const climate = ctx.climate ?? NO_CLIMATE;
  const nights = Math.max(1, ctx.nights ?? 1);
  const scale = TIER_SCALE[ctx.tier];

  const out: PackSuggestion[] = [];
  for (const item of CATALOGUE) {
    if (item.needs && !item.needs(climate)) continue;

    // The tier scales what the trip's length asked for; a flat `base` is a
    // count of one thing, and half a toothbrush is not a lighter bag.
    if (!item.perNights) {
      out.push({
        label: item.label,
        category: item.category,
        quantity: clampPackQuantity(item.base ?? 1),
      });
      continue;
    }

    // Spare first, then the cap — the cap is a ceiling on the whole row, so a
    // month away can't sneak a fifteenth pair past a stated fourteen.
    const wanted =
      Math.ceil((nights / item.perNights) * scale) + (item.spare ?? 0);
    const cap = Math.ceil((item.cap ?? MAX_PACK_QUANTITY) * scale);

    out.push({
      label: item.label,
      category: item.category,
      quantity: clampPackQuantity(Math.min(wanted, cap)),
    });
  }
  return out;
}

/**
 * Suggestions the bag doesn't already hold. This is what makes regenerate safe:
 * a label already on the list is left exactly as it is, count, tick and all, so
 * re-running only ever adds.
 */
export function newSuggestionsOnly(
  suggestions: PackSuggestion[],
  existingLabels: string[],
): PackSuggestion[] {
  const have = new Set(existingLabels.map((l) => l.trim().toLowerCase()));
  return suggestions.filter((s) => !have.has(s.label.toLowerCase()));
}
