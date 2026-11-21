export type StartStep = "ask" | "where" | "dates" | "who" | "name";

export type StartAnswers = { fromListing: boolean; where: boolean | null; dates: boolean | null };

export function startSteps({ fromListing, where, dates }: StartAnswers): StartStep[] {
  const steps: StartStep[] = ["ask"];
  if (!fromListing && where === true) steps.push("where");
  if (dates === true) steps.push("dates");
  steps.push("who", "name");
  return steps;
}

export function startDots(steps: StartStep[], at: number): { of: number; at: number } {
  return { of: steps.length + 1, at: at + 1 };
}

export const START_PLACES_CAP = 8;
export const START_PLACE_LENGTH = 80;

export function readStartPlaces(values: unknown[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    if (typeof value !== "string") continue;
    const place = value.trim().slice(0, START_PLACE_LENGTH);
    const key = place.toLowerCase();
    if (!place || seen.has(key)) continue;
    seen.add(key);
    out.push(place);
    if (out.length === START_PLACES_CAP) break;
  }
  return out;
}
