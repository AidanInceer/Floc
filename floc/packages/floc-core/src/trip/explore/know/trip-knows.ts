import type { TripKnow } from "./know-types";
import { AFRICA_KNOW } from "./trips/africa/africa-know";
import { AMERICAS_KNOW } from "./trips/americas/americas-know";
import { ASIA_KNOW } from "./trips/asia/asia-know";
import { EUROPE_KNOW } from "./trips/europe/europe-know";
import { OCEANIA_KNOW } from "./trips/oceania/oceania-know";

export const TRIP_KNOWS: Record<string, TripKnow> = { ...AFRICA_KNOW, ...AMERICAS_KNOW, ...ASIA_KNOW, ...EUROPE_KNOW, ...OCEANIA_KNOW };

export function tripKnow(id: string): TripKnow | null {
  return TRIP_KNOWS[id] ?? null;
}
