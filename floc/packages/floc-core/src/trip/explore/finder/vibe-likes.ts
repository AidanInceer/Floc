import type { VibeTag } from "../../vibe-tags";
import type { TripTag } from "./tag-groups";

const VIBE_LIKES: Record<VibeTag, readonly TripTag[]> = {
  "early starts": [],
  "late nights": [],
  "city breaks": ["Cities"],
  beaches: ["Beaches", "Coast"],
  "road trips": ["Road trip"],
  hiking: ["Hiking", "Mountains"],
  "food first": ["Food"],
  museums: ["History"],
  festivals: [],
  "slow mornings": ["Slow"],
};

const isVibe = (tag: string): tag is VibeTag => Object.hasOwn(VIBE_LIKES, tag);

export function vibeLikes(vibes: readonly string[]): TripTag[] {
  return [...new Set(vibes.filter(isVibe).flatMap((vibe) => VIBE_LIKES[vibe]))];
}
