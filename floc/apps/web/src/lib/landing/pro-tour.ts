// Illustrative sample, not a live query: what Pro does across one Sicily trip,
// today and next. `inPro` must match the FAQ's "What does Pro add?" answer.

export type ProFeatureKey =
  | "weather"
  | "packing"
  | "search"
  | "files"
  | "agent"
  | "live"
  | "local"
  | "extension"
  | "forward"
  | "receipt"
  | "offline"
  | "keep";

export type ProFeature = { key: ProFeatureKey; title: string; line: string; inPro: boolean };

const feature = (key: ProFeatureKey, inPro: boolean, title: string, line: string): ProFeature => ({ key, title, line, inPro });

export const PRO_FEATURES: Record<ProFeatureKey, ProFeature> = {
  weather: feature("weather", true, "Weather for your dates", "The forecast for each stop, on the days you’re there."),
  packing: feature("packing", true, "Packing from the forecast", "A list built from the weather and the plan."),
  search: feature("search", true, "Flights and stays, pre-filled", "Searches open with your dates, airports and headcount."),
  files: feature("files", true, "Room for every ticket", "More trip storage for passes, scans and bookings."),
  agent: feature("agent", false, "A travel agent in your pocket", "Ask it anything about the trip. It knows the plan, the group and what’s left to do."),
  live: feature("live", false, "Live trip mode", "On the day, the trip shows what’s next: when to leave, which platform, who has the tickets."),
  local: feature("local", false, "Local picks", "Places near where you sleep each night, picked for your group and the weather."),
  extension: feature("extension", false, "Save from any booking site", "A browser button that sends the stay or flight you’re looking at to the trip."),
  forward: feature("forward", false, "Forward a booking", "Send the confirmation email to the trip. It lands on the right day."),
  receipt: feature("receipt", false, "Snap the bill", "Photograph a receipt. The amount and the split fill themselves in."),
  offline: feature("offline", false, "Works with no signal", "The whole trip on your phone, up a mountain or on the plane."),
  keep: feature("keep", false, "The trip, kept", "Afterwards: the route, the days and the total on one page."),
};

export type ProRow = { key: ProFeatureKey; title: string; detail: string; action?: string };

export type ProStage = {
  name: string;
  what: string;
  /** The trip tab the web page has open at this stage. */
  tab: string;
  /** The web page's heading; the phone shows `title`. */
  page: string;
  over: string;
  title: string;
  banner?: { key: ProFeatureKey; text: string };
  rows: ProRow[];
};

export const PRO_TABS = ["Where", "When", "The plan", "Money", "Packing", "Tickets"];

export const PRO_STAGES: ProStage[] = [
  {
    name: "Deciding",
    what: "Where and when",
    tab: "When",
    page: "Sicily",
    over: "Sicily · 12–19 Sep",
    title: "Where and when",
    rows: [
      { key: "agent", title: "Ask Floc", detail: "“Which week is driest?” Week of 12 Sep." },
      { key: "weather", title: "Weather for 12–19 Sep", detail: "Palermo 27° · Cefalù 26° · Etna 14°" },
      { key: "local", title: "Near Cefalù", detail: "Da Nino · lunch · 4 min walk" },
    ],
  },
  {
    name: "Booking",
    what: "Getting it locked in",
    tab: "Tickets",
    page: "Sicily",
    over: "Sicily · 12–19 Sep",
    title: "Getting there",
    rows: [
      { key: "search", title: "Flights home", detail: "PMO → LGW · Sun 19 Sep · 6", action: "Search" },
      { key: "extension", title: "Hotel Kalura", detail: "Saved from booking.com · £412" },
      { key: "forward", title: "Train to Taormina", detail: "From Sam’s email · Day 4, 10:12" },
    ],
  },
  {
    name: "Away",
    what: "On the trip",
    tab: "The plan",
    page: "Sicily · Cefalù",
    over: "Day 3 · Tue 14 Sep",
    title: "Cefalù",
    banner: { key: "live", text: "Next: train in 20 min · Platform 3" },
    rows: [
      { key: "packing", title: "Packing", detail: "Light jumper for Etna" },
      { key: "files", title: "Tickets", detail: "9 files · the train pass is on top" },
      { key: "offline", title: "No signal", detail: "Everything saved" },
      { key: "receipt", title: "Dinner, Sam paid", detail: "Scanned · €84.00 · €14.00 each" },
    ],
  },
  {
    name: "Home again",
    what: "After",
    tab: "The plan",
    page: "Sicily",
    over: "September 2026",
    title: "Sicily, kept",
    rows: [
      { key: "keep", title: "The trip", detail: "7 nights · 4 stops · 6 people" },
      { key: "agent", title: "Ask Floc", detail: "“What did we spend on food?” £96 each." },
    ],
  },
];

export type StageNote = { key: ProFeatureKey; n: number; inPro: boolean };

/** The notes beside a stage, one per feature it shows. Numbers pair each note with its row once the lines hide. */
export function stageNotes(stage: ProStage): StageNote[] {
  const keys = [...new Set([...(stage.banner ? [stage.banner.key] : []), ...stage.rows.map((r) => r.key)])];
  const ordered = [...keys.filter((k) => PRO_FEATURES[k].inPro), ...keys.filter((k) => !PRO_FEATURES[k].inPro)];
  return ordered.map((key, i) => ({ key, n: i + 1, inPro: PRO_FEATURES[key].inPro }));
}

/** Front-door scenes play once and rest (ADR-019), so the tour stops on the last stage. */
export function nextStage(at: number, count: number): number | null {
  return at + 1 < count ? at + 1 : null;
}
