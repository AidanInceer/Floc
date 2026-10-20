import type { PresetTrip } from "../preset-trip-types";
import type { TransportType } from "../../../vocabulary";
import type { TripTag } from "./tag-groups";

// Why: a hop with no base after it is a day trip; it goes nowhere new, so it says nothing about getting around.
function movesOf(trip: PresetTrip): TransportType[] {
  return trip.legs.flatMap((leg, i) => (leg.kind === "hop" && trip.legs[i + 1]?.kind === "base" ? [leg.mode] : []));
}

function travelOf(moves: TransportType[]): TripTag[] {
  const count = (mode: TransportType) => moves.filter((m) => m === mode).length;
  const out: TripTag[] = [];
  if (count("train") >= 2) out.push("Rail");
  if (moves.length && count("car") / moves.length >= 0.6) out.push("Road trip");
  if (count("ferry") >= 2) out.push("Boats");
  if (count("flight") >= 2) out.push("Short flights");
  return out;
}

function paceOf(trip: PresetTrip, moves: number): TripTag {
  const perWeek = (moves / trip.nights) * 7;
  if (perWeek <= 2.4) return "Slow";
  return perWeek <= 2.9 ? "Steady" : "On the move";
}

/** Every tag a listing carries: what it is for, where it goes, how it gets around, its pace and its effort. */
export function tagsOf(trip: PresetTrip): TripTag[] {
  const moves = movesOf(trip);
  return [...trip.interests, ...trip.landscape, ...travelOf(moves), paceOf(trip, moves.length), trip.effort];
}
