import { type TravelMap, wantToGoCountries } from "../itinerary/travel-map";
import { PRESET_TRIPS, type PresetTrip } from "../trip/explore/preset-trips";

import type { Visibility } from "./visibility";

const presetById = new Map(PRESET_TRIPS.map((t) => [t.id, t]));

export type FriendFace = { id: string; name: string };

export type FriendSaves = {
  trips: Record<string, FriendFace[]>;
  countries: Record<string, FriendFace[]>;
};

export type FriendSavedPart = { trips: PresetTrip[]; countries: { code: string; name: string }[] };

export function friendSavedPart(saved: string[] | null, map: Pick<TravelMap, "states"> | null): FriendSavedPart | null {
  if (!saved) return null;
  const trips = saved.map((id) => presetById.get(id)).filter((t): t is PresetTrip => Boolean(t));
  const countries = map ? wantToGoCountries(map) : [];
  return trips.length + countries.length === 0 ? null : { trips, countries };
}

export function savedSeenBy(ring: Visibility, isPrivate: boolean): string | null {
  if (isPrivate || ring === "private") return null;
  return ring === "friends" ? "Friends can see this" : "Trip members can see this";
}

export function savedTooLabel(names: string[]): string {
  const list = names.length < 2 ? names.join("") : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
  return `${list} saved this too`;
}
