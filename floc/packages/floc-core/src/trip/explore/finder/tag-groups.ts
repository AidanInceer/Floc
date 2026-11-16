export const TAG_GROUPS = {
  interests: ["Food", "Hiking", "Wildlife", "History", "Cities", "Beaches"],
  landscape: ["Mountains", "Coast", "Desert", "Rainforest", "Savannah", "Countryside"],
  travel: ["Rail", "Road trip", "Boats", "Short flights"],
  pace: ["Slow", "Steady", "On the move"],
  effort: ["Easy", "Moderate", "Tough"],
} as const;

export type Interest = (typeof TAG_GROUPS.interests)[number];
export type Landscape = (typeof TAG_GROUPS.landscape)[number];
export type Effort = (typeof TAG_GROUPS.effort)[number];
export type TripTag = (typeof TAG_GROUPS)[keyof typeof TAG_GROUPS][number];

export const MAIN_TAGS: readonly TripTag[] = [...TAG_GROUPS.interests, ...TAG_GROUPS.landscape];
export const MORE_TAGS: readonly TripTag[] = [...TAG_GROUPS.travel, ...TAG_GROUPS.pace, ...TAG_GROUPS.effort];
export const ALL_TAGS: readonly TripTag[] = [...MAIN_TAGS, ...MORE_TAGS];

export const isTripTag = (value: unknown): value is TripTag => typeof value === "string" && (ALL_TAGS as readonly string[]).includes(value);
