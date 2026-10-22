import type { IdeaCost, IdeaPace, PresetStopIdeas, PresetSwap } from "./preset-detail-types";

/** Other things to do at a stop, written as `[idea, pace, cost]`. */
export function at(place: string, ideas: [string, IdeaPace, IdeaCost][]): PresetStopIdeas {
  return { place, ideas: ideas.map(([text, pace, cost]) => ({ text, pace, cost })) };
}

/** A place to go for `nights` nights in place of the listing's stop `instead`. */
export function swap(place: string, nights: number, instead: string, what: string): PresetSwap {
  return { place, nights, instead, what };
}
