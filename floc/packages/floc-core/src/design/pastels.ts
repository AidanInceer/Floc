import type { TripColor } from "../trip/trip-color";

export type Pastel = "pastel-blue" | "pastel-green" | "pastel-yellow" | "pastel-red";

const PASTEL_OF = {
  peri: "pastel-blue",
  mint: "pastel-green",
  butter: "pastel-yellow",
  blush: "pastel-red",
} as const satisfies Record<TripColor, Pastel>;

export function pastelOf(word: TripColor): Pastel {
  return PASTEL_OF[word];
}
