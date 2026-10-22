// Illustrative sample, not a live query: one Sicily trip, planned in eleven browser tabs, then in Floc with Pro.
// The travel agent has its own band, so it is not here.

export type ProFeatureKey =
  | "weather"
  | "local"
  | "search"
  | "save"
  | "forward"
  | "live"
  | "packing"
  | "receipt"
  | "offline"
  | "keep"
  | "files";

/** The domain pastel of what the feature touches. */
type ProTone = "blue" | "green" | "yellow" | "red";

/** `tab` is the browser tab the feature closes; `fav` is that tab's one-letter favicon. */
export type ProFeature = { title: string; tone: ProTone; pro: string; fav: string; tab: string };

const feature = (title: string, tone: ProTone, pro: string, fav: string, tab: string): ProFeature => ({ title, tone, pro, fav, tab });

export const PRO_FEATURES: Record<ProFeatureKey, ProFeature> = {
  weather: feature("Weather on your dates", "blue", "Palermo 27° · Etna 14°", "W", "Palermo 10-day forecast"),
  local: feature("Local picks", "yellow", "Da Nino · 4 min walk", "R", "Best restaurants in Cefalù"),
  search: feature("Flights filled in", "red", "PMO → LGW · 19 Sep · 6", "F", "Flights PMO to LGW, 19 Sep"),
  save: feature("Save from any site", "yellow", "Hotel Kalura · £412", "H", "Hotel Kalura – Book now"),
  forward: feature("Forward a booking", "blue", "Day 4 · train, 10:12", "M", "Inbox – Your train booking"),
  live: feature("Live trip mode", "blue", "20 min · Platform 3", "T", "Departures – Cefalù"),
  packing: feature("Packing from the forecast", "yellow", "Jumper for Etna, added", "N", "Packing list (copy 2)"),
  receipt: feature("Snap the bill", "green", "€84.00 · €14.00 each", "S", "Bill split – Dinner"),
  offline: feature("Works with no signal", "red", "9 tickets open offline", "P", "Screenshots – tickets"),
  keep: feature("Photos and the trip, kept", "blue", "212 photos · 4 stops", "D", "Sicily trip – old doc"),
  files: feature("Room for every ticket", "red", "9 files, room to spare", "C", "Cloud drive – full"),
};

export type ProStage = { name: string; keys: ProFeatureKey[] };

export const PRO_STAGES: ProStage[] = [
  { name: "Deciding", keys: ["weather", "local"] },
  { name: "Booking", keys: ["search", "save", "forward"] },
  { name: "Away", keys: ["live", "packing", "receipt", "offline"] },
  { name: "Home again", keys: ["keep", "files"] },
];

/** The planning tabs left to right, the same order the ticket reads. */
export const PRO_TABS: ProFeatureKey[] = PRO_STAGES.flatMap((s) => s.keys);

const FIRST_MS = 700;
const GAP_MS = 150;
const FLIGHT_MS = 600;

/** When the `i`th tab leaves the strip, ms after the band is first seen. */
export const closeAt = (i: number) => FIRST_MS + i * GAP_MS;

/** When the `i`th tab reaches its line on the ticket and shows the job done. */
export const landAt = (i: number) => closeAt(i) + FLIGHT_MS;

/** The closed tabs fold into one pile beside Floc, so the band at rest still says what happened. */
export const PILE_AT = closeAt(PRO_TABS.length) + 800;

/** The browser's tab count: Floc's own tab and every planning tab not yet closed. */
export const tabsOpen = (closed: number) => 1 + PRO_TABS.length - closed;
