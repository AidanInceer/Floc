import type { MarkId } from "./agent-prompt";

export type LaneTone = "blue" | "route" | "ticket" | "yours" | "yellow" | "red" | "green";
export type LaneRow = "dates" | "route" | "booked" | "yours" | "picks" | "pack" | "money";
export type Lane = {
  tone: LaneTone;
  glyph: "dates" | "weather" | "pin" | "stay" | "train" | "flight" | "eat" | "packing" | "money";
  name: string;
  /** What the job checks on the way. */
  via: string;
  /** What it ends with. */
  out: string;
  ms: number;
  /** The ticket row it fills. */
  row: LaneRow;
  /** The ask in the brief this lane answers, lit as it starts. */
  mark?: MarkId;
};

// Illustrative sample, not a live query — the Sicily brief, one lane per job, each running its own length.
export const LANES: readonly Lane[] = [
  { tone: "blue", glyph: "dates", name: "Dates", via: "6 calendars", out: "All 6 free, 12–19 Sep", ms: 1300, row: "dates", mark: 1 },
  { tone: "blue", glyph: "weather", name: "Weather", via: "30 Septembers", out: "Driest week · sea 25°", ms: 1900, row: "dates" },
  { tone: "route", glyph: "pin", name: "Route", via: "In Palermo, out Catania", out: "4 stops, 7 nights", ms: 1600, row: "route", mark: 2 },
  { tone: "ticket", glyph: "stay", name: "Stays", via: "Old towns, one beach", out: "4 booked", ms: 2600, row: "booked", mark: 3 },
  { tone: "ticket", glyph: "train", name: "Getting about", via: "Trains, a bus, a jeep", out: "4 booked", ms: 2300, row: "booked" },
  { tone: "yours", glyph: "flight", name: "Flights", via: "LGW, PMO, CTA", out: "2 ready to book", ms: 1500, row: "yours" },
  { tone: "yellow", glyph: "eat", name: "Food", via: "Near where you sleep", out: "7 local picks", ms: 2900, row: "picks", mark: 5 },
  { tone: "red", glyph: "packing", name: "Packing", via: "14° on Etna", out: "9 things, 1 shared", ms: 2100, row: "pack", mark: 4 },
  { tone: "green", glyph: "money", name: "Money", via: "£900 each", out: "£861 each", ms: 3200, row: "money", mark: 6 },
];
