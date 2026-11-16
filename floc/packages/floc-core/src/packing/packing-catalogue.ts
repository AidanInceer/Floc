import type { PackTier } from "./packing";
import { clampPackQuantity, MAX_PACK_QUANTITY } from "./packing";
import type { PackCategory } from "./packing";
import type { WeatherCondition } from "../itinerary/weather";

export type PackClimate = { hot: boolean; cold: boolean; wet: boolean };

export type PackContext = {
  nights: number | null;
  climate: PackClimate | null;
  tier: PackTier;
};

export type PackSuggestion = {
  label: string;
  quantity: number;
  category: PackCategory;
};

const HOT_ABOVE = 22;
const COLD_BELOW = 9;

const TIER_SCALE: Record<PackTier, number> = {
  light: 0.7,
  balanced: 1,
  comfort: 1.3,
};

type Item = {
  label: string;
  category: PackCategory;
  perNights?: number;
  base?: number;
  spare?: number;
  cap?: number;
  needs?: (climate: PackClimate) => boolean;
};

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

const NO_CLIMATE: PackClimate = { hot: false, cold: false, wet: false };

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

export function generatePackingList(ctx: PackContext): PackSuggestion[] {
  const climate = ctx.climate ?? NO_CLIMATE;
  const nights = Math.max(1, ctx.nights ?? 1);
  const scale = TIER_SCALE[ctx.tier];

  const out: PackSuggestion[] = [];
  for (const item of CATALOGUE) {
    if (item.needs && !item.needs(climate)) continue;

    if (!item.perNights) {
      out.push({
        label: item.label,
        category: item.category,
        quantity: clampPackQuantity(item.base ?? 1),
      });
      continue;
    }

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

export function newSuggestionsOnly(
  suggestions: PackSuggestion[],
  existingLabels: string[],
): PackSuggestion[] {
  const have = new Set(existingLabels.map((l) => l.trim().toLowerCase()));
  return suggestions.filter((s) => !have.has(s.label.toLowerCase()));
}
