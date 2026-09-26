/**
 * The four pastels. A row keeps its colour by the older word (a trip's
 * `color_key`, a notes highlight's `tone`), and rows are never rewritten for a
 * rename, so those words stay. This maps each to the token that paints it.
 */
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
