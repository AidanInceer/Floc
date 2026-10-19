import { PRESET_TRIPS, type PresetTrip } from "@floc/core/trip/explore/preset-trips";

type Leg = PresetTrip["legs"][number];

const base = (place: string, lat: number, lng: number, nights = 2): Leg => ({ kind: "base", place, nights, lat, lng });
const hop = (place: string, mode: Extract<Leg, { kind: "hop" }>["mode"], detail: string): Leg => ({ kind: "hop", place, mode, detail });

/** A listing with the given legs and nothing else changed: the route tests read only the legs. */
export const listing = (legs: Leg[]): PresetTrip => ({ ...PRESET_TRIPS[0]!, legs, nights: legs.reduce((n, l) => n + (l.kind === "base" ? l.nights : 0), 0) });

/** Four stops by train, west of Tokyo. */
export const RAIL = listing([
  base("Tokyo", 35.676, 139.65),
  hop("Hakone", "train", "1h 30"),
  base("Hakone", 35.233, 139.107),
  hop("Kyoto", "train", "2h 20"),
  base("Kyoto", 35.011, 135.768),
  hop("Osaka", "train", "30 min"),
  base("Osaka", 34.694, 135.502),
]);

/** One stop and a day out by boat. */
export const ONE_STOP = listing([base("Praiano", 40.611, 14.529, 7), hop("Positano, Amalfi, Capri", "ferry", "day hops")]);

/** Out and back: the route ends where it began. */
export const ROUND = listing([
  base("Puerto Natales", -51.729, -72.507),
  hop("Torres del Paine", "car", "2h"),
  base("Refugios on the W", -50.999, -72.986, 4),
  hop("Puerto Natales", "ferry", "3h"),
  base("Puerto Natales", -51.729, -72.507, 3),
]);

/** A hop named for the way, not for the place you stay next. */
export const VIA = listing([base("Marrakech", 31.63, -7.989, 3), hop("High Atlas", "car", "2h"), base("Imlil", 31.136, -7.919)]);

/** Stop to stop with no hop between: the listing does not say how. */
export const UNSAID = listing([base("Reykjavík", 64.146, -21.942), base("Vík", 63.418, -19.006)]);
