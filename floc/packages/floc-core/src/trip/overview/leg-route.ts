import { shortPlace } from "../../itinerary/names/place-name";
import type { TransportType } from "../../vocabulary";
import { lengthLabel, type OverviewRoute } from "./route";

export type Spot = { lat: number; lng: number };
export type LegLine = { path: string; seconds: number; metres: number };
export type LegMark = { from: Spot; to: Spot; mid: Spot; points: Spot[] | null; mode: TransportType | null; text: string; label: string };
export type StopPin = Spot & { place: string; nos: number[] };

const MODE_NAME: Record<TransportType, string> = { flight: "Flight", train: "Train", car: "Car", ferry: "Ferry", other: "" };
const HALFWAY = 0.5;
const RETURN_HOP = 0.3;

type Waypoint = { location: { latLng: { latitude: number; longitude: number } } };
export type RouteRequest = { origin: Waypoint; destination: Waypoint } & (
  | { travelMode: "DRIVE"; routingPreference: "TRAFFIC_UNAWARE" }
  | { travelMode: "TRANSIT"; transitPreferences: { allowedTravelModes: ["RAIL"] } }
);

const waypoint = (spot: Spot): Waypoint => ({ location: { latLng: { latitude: spot.lat, longitude: spot.lng } } });

export function routeRequest(from: Spot, to: Spot, mode: TransportType | null): RouteRequest | null {
  const ends = { origin: waypoint(from), destination: waypoint(to) };
  if (mode === "car") return { ...ends, travelMode: "DRIVE", routingPreference: "TRAFFIC_UNAWARE" };
  if (mode === "train") return { ...ends, travelMode: "TRANSIT", transitPreferences: { allowedTravelModes: ["RAIL"] } };
  return null;
}

type Answer = { routes?: { duration?: unknown; distanceMeters?: unknown; polyline?: { encodedPolyline?: unknown } }[] };

function secondsOf(duration: unknown): number | null {
  if (typeof duration !== "string" || duration.length < 2 || !duration.endsWith("s")) return null;
  const seconds = Number(duration.slice(0, -1));
  return Number.isFinite(seconds) && seconds >= 0 ? Math.round(seconds) : null;
}

export function readRoute(body: unknown): LegLine | null {
  const first = (body as Answer | null)?.routes?.[0];
  if (!first) return null;
  const seconds = secondsOf(first.duration);
  const path = first.polyline?.encodedPolyline;
  if (seconds === null || typeof first.distanceMeters !== "number" || typeof path !== "string" || !path) return null;
  return { path, seconds, metres: first.distanceMeters };
}

export function decodePolyline(path: string): Spot[] {
  const points: Spot[] = [];
  let [at, lat, lng] = [0, 0, 0];
  const next = () => {
    let [value, shift, chunk] = [0, 0, 0];
    do {
      chunk = path.charCodeAt(at++) - 63;
      value |= (chunk & 0x1f) << shift;
      shift += 5;
    } while (chunk >= 0x20);
    return value & 1 ? ~(value >> 1) : value >> 1;
  };
  while (at < path.length) {
    lat += next();
    lng += next();
    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return points;
}

const sameSpot = (a: Spot, b: Spot) => a.lat === b.lat && a.lng === b.lng;

export function stopPins(route: OverviewRoute): StopPin[] {
  const pins: StopPin[] = [];
  route.stops.forEach((stop, i) => {
    const there = pins.find((pin) => sameSpot(pin, stop));
    if (there) there.nos.push(i + 1);
    else pins.push({ lat: stop.lat, lng: stop.lng, place: shortPlace(stop.place), nos: [i + 1] });
  });
  return pins;
}

function along(from: Spot, to: Spot, points: Spot[] | null, share: number): Spot {
  return points?.[Math.floor(points.length * share)] ?? { lat: from.lat + (to.lat - from.lat) * share, lng: from.lng + (to.lng - from.lng) * share };
}

export function legMarks(route: OverviewRoute, lines: readonly (LegLine | null)[]): LegMark[] {
  const ends = route.moves.map((_, i) => {
    const [a, b] = [route.stops[i], route.stops[i + 1]];
    return { from: { lat: a.lat, lng: a.lng }, to: { lat: b.lat, lng: b.lng } };
  });
  return route.moves.map((move, i) => {
    const line = lines[i] ?? null;
    const { from, to } = ends[i];
    const points = line ? decodePolyline(line.path) : null;
    const goesBack = ends.slice(0, i).some((e) => sameSpot(e.from, to) && sameSpot(e.to, from));
    const text = move.time || (line ? `About ${lengthLabel(Math.round(line.seconds / 60))}` : "");
    return {
      from,
      to,
      mid: along(from, to, points, goesBack ? RETURN_HOP : HALFWAY),
      points,
      mode: move.mode,
      text,
      label: [move.mode ? MODE_NAME[move.mode] : "", text].filter(Boolean).join(", "),
    };
  });
}
