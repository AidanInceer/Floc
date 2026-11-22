import { stopsOf } from "../listing-stops";
import type { PresetTrip } from "../preset-trip-types";
import type { TransportType } from "../../../vocabulary";
import type { TripTag } from "./tag-groups";

function movesOf(trip: PresetTrip): TransportType[] {
  return stopsOf(trip).flatMap((stop) => (stop.arrive ? [stop.arrive.mode] : []));
}

export function travelTags(moves: readonly TransportType[]): TripTag[] {
  const count = (mode: TransportType) => moves.filter((m) => m === mode).length;
  const out: TripTag[] = [];
  if (count("train") >= 2) out.push("Rail");
  if (moves.length && count("car") / moves.length >= 0.6) out.push("Road trip");
  if (count("ferry") >= 2) out.push("Boats");
  if (count("flight") >= 2) out.push("Short flights");
  return out;
}

export function paceTag(nights: number, moves: number): TripTag {
  const perWeek = (moves / nights) * 7;
  if (perWeek <= 2.4) return "Slow";
  return perWeek <= 2.9 ? "Steady" : "On the move";
}

export function tagsOf(trip: PresetTrip): TripTag[] {
  const moves = movesOf(trip);
  return [...trip.interests, ...trip.landscape, ...travelTags(moves), paceTag(trip.nights, moves.length), trip.effort];
}
