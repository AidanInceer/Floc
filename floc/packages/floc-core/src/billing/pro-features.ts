import { HORIZON_DAYS } from "../itinerary/weather";
import type { FeatureKey } from "./plans";

export type ProFeature = {
  key: FeatureKey;
  name: string;
  detail: string;
  phrase: string;
  tag: string;
};

export const PRO_FEATURES = [
  {
    key: "money.estimate",
    name: "Estimate your cost",
    detail: "See what the trip costs you and whether it fits your budget.",
    phrase: "your own cost estimate and budget for each trip",
    tag: "cost estimate",
  },
  {
    key: "dates.weather",
    name: "See the forecast",
    detail: `Each stop's forecast, up to ${HORIZON_DAYS} days ahead.`,
    phrase: `each stop’s forecast on your dates (up to ${HORIZON_DAYS} days ahead)`,
    tag: "weather",
  },
  {
    key: "packing.autoGenerate",
    name: "Get a packing list",
    detail: "Floc writes your list from where you go and the weather there.",
    phrase: "a packing list built from the forecast and your plan",
    tag: "packing list",
  },
  {
    key: "bookings.autoFile",
    name: "Bookings read for you",
    detail: "Forward a booking. Floc finds the trip and fills in the details for you to save.",
    phrase: "Floc reading the bookings you forward and filling in the details",
    tag: "booking reading",
  },
  {
    key: "files.extraStorage",
    name: "More room for your files",
    detail: "Your own space for tickets and photos on each trip.",
    phrase: "more room for tickets",
    tag: "file space",
  },
] as const satisfies readonly ProFeature[];

export type ProFeatureKey = (typeof PRO_FEATURES)[number]["key"];

export function proFeatureSentence(): string {
  const phrases = PRO_FEATURES.map((f) => f.phrase);
  return `${phrases.slice(0, -1).join(", ")}, and ${phrases.at(-1)}`;
}

export function proFeatureSummary(): string {
  const [first, ...rest] = PRO_FEATURES.slice(0, 3).map((f) => f.tag);
  return `${first[0].toUpperCase()}${first.slice(1)}, ${rest.join(", ")}, and more`;
}
