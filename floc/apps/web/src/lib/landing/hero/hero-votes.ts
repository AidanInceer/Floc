export const heroPlaces = ["Lisbon", "Sicily", "Croatia"] as const;
export type HeroPlace = (typeof heroPlaces)[number];

// Lisbon gets out in front, Croatia takes one, Sicily draws level, then takes it.
export const heroVotes: readonly { who: string; place: HeroPlace }[] = [
  { who: "Priya", place: "Lisbon" },
  { who: "Jo", place: "Lisbon" },
  { who: "Kit", place: "Croatia" },
  { who: "Sam", place: "Sicily" },
  { who: "Alex", place: "Sicily" },
  { who: "Maya", place: "Sicily" },
];

export function tally(cast: number): Record<HeroPlace, number> {
  const count: Record<HeroPlace, number> = { Lisbon: 0, Sicily: 0, Croatia: 0 };
  for (const vote of heroVotes.slice(0, cast)) count[vote.place]++;
  return count;
}

export function leader(count: Record<HeroPlace, number>): HeroPlace | null {
  const top = Math.max(...Object.values(count));
  const tops = heroPlaces.filter((p) => count[p] === top);
  return tops.length === 1 ? tops[0]! : null;
}

export function voteHeadline(cast: number): string {
  if (cast === 0) return `0 of ${heroVotes.length} voted`;
  const lead = leader(tally(cast));
  if (cast >= heroVotes.length) return `All ${heroVotes.length} · ${lead}`;
  return lead ? `${lead} leads` : "Tied";
}
