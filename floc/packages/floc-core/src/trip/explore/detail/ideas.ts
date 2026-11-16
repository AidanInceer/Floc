import type { IdeaCost, IdeaPace, PresetStopIdeas, PresetSwap } from "./preset-detail-types";

export function at(place: string, ideas: [string, IdeaPace, IdeaCost][]): PresetStopIdeas {
  return { place, ideas: ideas.map(([text, pace, cost]) => ({ text, pace, cost })) };
}

export function swap(place: string, nights: number, instead: string, what: string): PresetSwap {
  return { place, nights, instead, what };
}
