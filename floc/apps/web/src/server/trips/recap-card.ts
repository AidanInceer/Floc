/**
 * What the recap share picture draws (#443, ADR-045): the trip's words and the land under its route.
 * Null for a trip that has not ended or has no dates — there is nothing to share yet (rules 4, 9).
 */
import { readFileSync } from "node:fs";
import path from "node:path";

import { hasEnded } from "@floc/core/dates/dates";
import { tripLegs } from "@floc/core/trip/overview/legs";
import { overviewRoute } from "@floc/core/trip/overview/route";
import { recapCard, type RecapCard } from "@floc/core/trip/overview/recap";
import { drawOutline } from "@/components/explore/outline/drawing";
import { codesAt, landFromPacked, type Piece } from "@/components/explore/outline/land";
import { listRouteDays, transportByDay } from "@/server/itinerary/itinerary";

const MAP_WIDTH = 936;
// Why: the picture is a fixed 1080×1350; a short stop list hands its rows to the map, so no gap opens above the foot.
const mapHeight = (stops: number) => 620 + (8 - Math.min(stops, 8)) * 48;

export type RecapPicture = {
  card: RecapCard;
  land: { home: string; other: string };
  pins: { no: number; x: number; y: number }[];
  map: { width: number; height: number };
};

let land: readonly Piece[] | null = null;
// Why: read once per server, from the same file Explore draws its outlines from; no tiles, no key (rule 11).
function landOnce(): readonly Piece[] {
  if (!land) {
    try {
      land = landFromPacked(JSON.parse(readFileSync(path.join(process.cwd(), "public", "land-50m.json"), "utf8")));
    } catch {
      land = [];
    }
  }
  return land;
}

export async function recapPictureFor(trip: { id: number; name: string; startDate: string | null; endDate: string | null }): Promise<RecapPicture | null> {
  if (!trip.startDate || !trip.endDate || !hasEnded(trip.endDate)) return null;
  const [days, transport] = await Promise.all([listRouteDays(trip.id), transportByDay(trip.id)]);
  const modes = new Map([...transport].map(([dayId, t]) => [dayId, t.mode]));
  const { legs } = tripLegs({ days, modes, files: [], tripEnd: trip.endDate });
  const route = overviewRoute({ legs, days, hops: transport });

  const card = recapCard({ name: trip.name, startDate: trip.startDate, endDate: trip.endDate, stops: route.stops });
  const pieces = landOnce();
  const map = { width: MAP_WIDTH, height: mapHeight(route.stops.length) };
  const drawn = drawOutline(route.stops, codesAt(pieces, route.stops), pieces, map);
  const pins = drawn.frame ? route.stops.map((s, i) => ({ no: i + 1, ...drawn.frame!.point(s) })) : [];
  return { card, land: { home: drawn.home, other: drawn.other }, pins, map };
}
