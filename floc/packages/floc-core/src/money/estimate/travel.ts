import { LINE_LABELS, type EstimateLine } from "./lines";

export const TRAVEL_MODES = ["flights", "train", "drive", "ferry"] as const;
export type TravelMode = (typeof TRAVEL_MODES)[number];

export const TRAVEL_LABELS: Record<TravelMode, string> = {
  flights: "Flights",
  train: "Train",
  drive: "Driving",
  ferry: "Ferry",
};

export const TRAVEL_GLYPHS: Record<TravelMode, "flight" | "train" | "car" | "ferry"> = {
  flights: "flight",
  train: "train",
  drive: "car",
  ferry: "ferry",
};

export const NOT_IN_BUDGET = "Not in your budget. The spending still counts.";

export const removedLabel = (line: EstimateLine): string => (line === "flights" ? "Getting there" : LINE_LABELS[line]);

export const isTravelMode = (value: unknown): value is TravelMode => TRAVEL_MODES.includes(value as TravelMode);

export function lineLabel(line: EstimateLine, travel: TravelMode): string {
  return line === "flights" ? TRAVEL_LABELS[travel] : LINE_LABELS[line];
}

export function awaitingWords(travel: TravelMode): string {
  return `Add your ${TRAVEL_LABELS[travel].toLowerCase()} figure`;
}
