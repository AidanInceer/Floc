import type { Fits } from "./listing-fit";
import type { TravelProfile } from "./travel-profile";

export const GROUP_FIT = { spread: 0.6, ideas: 10 } as const;

export type GroupIdea = { presetId: string; match: number };

export const withoutSpend = (profile: TravelProfile): TravelProfile => ({
  ...profile,
  past: profile.past.map((trip) => ({ ...trip, spend: [] })),
});

function lowered(figures: readonly number[]): number {
  const mean = figures.reduce((sum, figure) => sum + figure, 0) / figures.length;
  const spread = Math.sqrt(figures.reduce((sum, figure) => sum + (figure - mean) ** 2, 0) / figures.length);
  return Math.max(0, Math.round(mean - GROUP_FIT.spread * spread));
}

export function groupFits(members: readonly Fits[]): Fits {
  const figures = new Map<string, number[]>();
  for (const fits of members) {
    for (const [presetId, figure] of Object.entries(fits)) figures.set(presetId, [...(figures.get(presetId) ?? []), figure]);
  }
  return Object.fromEntries([...figures].map(([presetId, list]) => [presetId, lowered(list)]));
}

export function groupIdeas(fits: Fits, order: readonly string[], limit: number = GROUP_FIT.ideas): GroupIdea[] {
  return order
    .flatMap((presetId, place) => (presetId in fits ? [{ presetId, match: fits[presetId], place }] : []))
    .sort((a, b) => b.match - a.match || a.place - b.place)
    .slice(0, limit)
    .map(({ presetId, match }) => ({ presetId, match }));
}
