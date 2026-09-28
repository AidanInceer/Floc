// Illustrative sample, not a live query: one Sicily trip, the same page without and with Pro.
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

/** The domain pastel of what the feature touches: gold says Pro did it, the pastel says where. */
type ProTone = "blue" | "green" | "yellow" | "red";

export type ProFeature = { title: string; tone: ProTone; row: string; free: string; pro: string };

const feature = (title: string, tone: ProTone, row: string, free: string, pro: string): ProFeature => ({ title, tone, row, free, pro });

export const PRO_FEATURES: Record<ProFeatureKey, ProFeature> = {
  weather: feature("Weather on your dates", "blue", "12–19 Sep", "7 nights", "Palermo 27° · Etna 14°"),
  local: feature("Local picks", "yellow", "Cefalù", "2 nights", "Da Nino · 4 min walk"),
  search: feature("Flights pre-filled", "red", "Flights home", "Not booked", "PMO → LGW · 19 Sep · 6"),
  save: feature("Save from any site", "yellow", "Stay in Cefalù", "Paste a link", "Hotel Kalura · £412"),
  forward: feature("Forward a booking", "blue", "Day 4", "Add a time", "Train to Taormina · 10:12"),
  live: feature("Live trip mode", "blue", "Next", "Day 3 · Cefalù", "Train in 20 min · Platform 3"),
  packing: feature("Packing from the forecast", "yellow", "Packing", "14 things", "Light jumper for Etna, added"),
  receipt: feature("Snap the bill", "green", "Dinner", "Enter an amount", "€84.00 · €14.00 each"),
  offline: feature("Works with no signal", "red", "No signal", "Can’t load tickets", "9 tickets saved"),
  keep: feature("The trip, kept", "blue", "Sicily", "12–19 Sep", "Kept · 7 nights · 4 stops"),
  files: feature("Room for every ticket", "red", "Tickets", "Storage full", "9 files, room to spare"),
};

export type ProStage = { name: string; what: string; keys: ProFeatureKey[] };

export const PRO_STAGES: ProStage[] = [
  { name: "Deciding", what: "Where and when", keys: ["weather", "local"] },
  { name: "Booking", what: "Getting it locked in", keys: ["search", "save", "forward"] },
  { name: "Away", what: "On the trip", keys: ["live", "packing", "receipt", "offline"] },
  { name: "Home again", what: "After", keys: ["keep", "files"] },
];

/** Front-door scenes play once and rest (ADR-019), so the tour stops on the last stage. */
export function nextStage(at: number, count: number): number | null {
  return at + 1 < count ? at + 1 : null;
}
