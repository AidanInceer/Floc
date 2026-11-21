import "server-only";

import type { Finder } from "@floc/core/trip/explore/finder/finder";
import { savedFinder } from "@floc/core/trip/explore/finder/finder-read";
import type { TripTag } from "@floc/core/trip/explore/finder/tag-groups";
import { vibeLikes } from "@floc/core/trip/explore/finder/vibe-likes";
import { readVibeTags } from "@floc/core/trip/vibe-tags";

import { ensureProfile, getProfile, updateProfileFields } from "@/server/auth/profile";

export type ExploreTaste = { finder: Finder | null; likes: TripTag[] };

export async function loadTaste(userId: string): Promise<ExploreTaste> {
  const profile = await getProfile(userId);
  const finder = savedFinder(profile?.exploreAnswers);
  const likes = [...new Set([...(finder?.likes ?? []), ...vibeLikes(readVibeTags(profile?.vibeTags))])];
  return { finder, likes };
}

export async function loadFinder(userId: string): Promise<Finder | null> {
  return (await loadTaste(userId)).finder;
}

export async function saveFinder(userId: string, finder: Finder): Promise<void> {
  await ensureProfile(userId);
  await updateProfileFields(userId, { exploreAnswers: { finder: { ...finder, q: "" } } });
}
