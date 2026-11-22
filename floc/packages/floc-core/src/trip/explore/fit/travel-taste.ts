import type { Currency } from "../../../money/currency";
import type { Pace, StayStyle } from "../../../money/estimate/style";
import { convertMinor } from "../../../money/money";
import { countryRegion } from "../country-region";
import type { TripTag } from "../finder/tag-groups";
import { paceTag, tagsOf, travelTags } from "../finder/trip-tags";
import { vibeLikes } from "../finder/vibe-likes";
import type { ListingRates } from "../listing-price";
import type { PresetTrip } from "../preset-trip-types";
import type { PastTrip, TravelProfile } from "./travel-profile";

export type Taste = {
  likes: ReadonlyMap<string, number>;
  strongest: readonly number[];
  nights: number | null;
  perNight: number | null;
  stay: StayStyle | null;
  wantToGo: ReadonlySet<string>;
};

const PACE_TAG: Record<Pace, TripTag> = { easy: "Slow", balanced: "Steady", active: "On the move" };

export const listingKeys = (trip: PresetTrip): string[] => [...new Set<string>([...tagsOf(trip), trip.region])];

export function inHome(minor: number, currency: Currency, rates: ListingRates | null): number | null {
  const home = rates?.home ?? "GBP";
  if (currency === home) return minor;
  const rate = rates?.toHome[currency];
  return rate && rate > 0 ? convertMinor(minor, currency, home, rate) : null;
}

function middle(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const at = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[at] : (sorted[at - 1] + sorted[at]) / 2;
}

function pastKeys(trip: PastTrip): string[] {
  const regions = trip.countries.map(countryRegion).filter((region) => region !== null);
  return [...new Set<string>([...travelTags(trip.moves), paceTag(trip.nights, Math.max(0, trip.stops - 1)), ...regions])];
}

function spentPerNight(trip: PastTrip, rates: ListingRates | null): number | null {
  const parts = trip.spend.map((s) => inHome(s.minor, s.currency, rates));
  if (!parts.length || parts.some((part) => part === null)) return null;
  const total = parts.reduce<number>((sum, part) => sum + (part ?? 0), 0);
  return total > 0 ? total / trip.nights : null;
}

function likesOf(profile: TravelProfile, past: readonly PastTrip[], trips: readonly PresetTrip[]): Map<string, number> {
  const likes = new Map<string, number>();
  const add = (keys: readonly string[], amount: number) => {
    for (const key of keys) likes.set(key, (likes.get(key) ?? 0) + amount);
  };
  add(vibeLikes(profile.vibes), 1);
  if (profile.pace) add([PACE_TAG[profile.pace]], 1);
  const saved = trips.filter((trip) => profile.saved.includes(trip.id));
  for (const trip of saved) add(listingKeys(trip), 1 / saved.length);
  for (const trip of past) add(pastKeys(trip), 1 / past.length);
  return likes;
}

export function tasteOf(profile: TravelProfile, trips: readonly PresetTrip[], rates: ListingRates | null): Taste | null {
  const past = profile.past.filter((trip) => trip.nights >= 1);
  const likes = likesOf(profile, past, trips);
  const nights = middle(past.map((trip) => trip.nights));
  const perNight = middle(past.map((trip) => spentPerNight(trip, rates)).filter((spent) => spent !== null));
  if (!likes.size && nights === null && perNight === null && !profile.stay) return null;
  return {
    likes,
    strongest: [...likes.values()].sort((a, b) => b - a),
    nights,
    perNight,
    stay: profile.stay,
    wantToGo: new Set(profile.wantToGo),
  };
}
