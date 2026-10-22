import type { ListingStop } from "../listing-stops";
import type { PresetIdeas } from "./preset-detail-types";

const MIN_IDEAS = 2;

/** What is wrong with a listing's ideas, in words its author can act on. Empty when every stop has some. */
export function checkIdeas(stops: ListingStop[], ideas: PresetIdeas): string[] {
  const places = [...new Set(stops.map((s) => s.place))];
  const problems: string[] = [];
  for (const place of places) {
    const written = ideas.atStops.filter((s) => s.place === place);
    if (written.length !== 1) problems.push(`ideas: ${place} wants one list, has ${written.length}`);
    else if (written[0].ideas.length < MIN_IDEAS) problems.push(`ideas: ${place} has ${written[0].ideas.length}, wants ${MIN_IDEAS} or more`);
  }
  for (const stop of ideas.atStops) if (!places.includes(stop.place)) problems.push(`ideas: "${stop.place}" is not a stop`);
  if (ideas.otherStops.length === 0) problems.push("ideas: no other stops");
  for (const swap of ideas.otherStops) {
    if (!places.includes(swap.instead)) problems.push(`ideas: ${swap.place} is instead of "${swap.instead}", not a stop`);
    if (!Number.isInteger(swap.nights) || swap.nights < 1) problems.push(`ideas: ${swap.place} wants 1 night or more`);
    if (!swap.what.trim()) problems.push(`ideas: ${swap.place} says nothing to do`);
  }
  return problems;
}
