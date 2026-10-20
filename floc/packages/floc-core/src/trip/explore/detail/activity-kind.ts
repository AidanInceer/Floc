import type { PresetDayItem } from "./preset-detail-types";

export const ACTIVITY_KINDS = ["flight", "train", "ferry", "drive", "food", "walk", "rest", "stay", "free", "sight"] as const;
export type ActivityKind = (typeof ACTIVITY_KINDS)[number];

// Why: listings are written as plain lines, so the kind is read from the words. Order matters — "Drive to the airport"
// is a drive, "Picnic lunch above the river" a meal, not a walk — and anything unmatched is a place to see.
const WORDS: [ActivityKind, RegExp][] = [
  ["drive", /^(drive|driver) /i],
  ["flight", /\b(airport|flight|fly|flies|aircraft|helicopter|balloon|connect home)\b/i],
  ["train", /\b(train|rail|shinkansen|romancecar|tram|metro|express|frecciarossa|pendular|tranzalpine)\b/i],
  ["ferry", /\b(ferry|boat|sail|cruise|crossing|kayak|canoe|mokoro|catamaran|felucca|dhow|long-tail)\b/i],
  ["food", /\b(breakfast|brunch|lunch|dinner|supper|picnic|tea|coffee|tapas|cicchetti|tasting|food|eat|bar|cooking|feast|winery|cellar|seafood|izakaya)\b/i],
  ["drive", /\b(drive|driving|road|car|bus|transfer|4x4|tuk-tuk|shuttle)\b/i],
  ["walk", /\b(walk|walking|trek|hike|hiking|on foot|climb|set off|trail|tracking)\b/i],
  ["rest", /\b(hammam|spa|onsen|bath|baths|pool|pools|springs|massage|swim)\b/i],
  ["stay", /\b(arrive|arrival|check in|check-in|settle in|back at camp|back at the lodge)\b/i],
];

/** What sort of thing a line of a day is, for its icon. */
export function activityKind(item: PresetDayItem): ActivityKind {
  if (item.free) return "free";
  return WORDS.find(([, re]) => re.test(item.text))?.[0] ?? "sight";
}
