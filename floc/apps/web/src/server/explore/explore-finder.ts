import "server-only";

import type { Finder } from "@floc/core/trip/explore/finder/finder";
import { savedFinder } from "@floc/core/trip/explore/finder/finder-read";
import type { TripTag } from "@floc/core/trip/explore/finder/tag-groups";
import { vibeLikes } from "@floc/core/trip/explore/finder/vibe-likes";
import type { TravelProfile } from "@floc/core/trip/explore/fit/travel-profile";
import { readVibeTags } from "@floc/core/trip/vibe-tags";

import { ensureProfile, getProfile, updateProfileFields } from "@/server/auth/profile";
import { loadPastTravel } from "@/server/explore/travel-read";

export type ExploreTaste = { finder: Finder | null; likes: TripTag[]; travel: TravelProfile };

export async function loadTaste(userId: string): Promise<ExploreTaste> {
  const [profile, past] = await Promise.all([getProfile(userId), loadPastTravel(userId)]);
  const finder = savedFinder(profile?.exploreAnswers);
  const vibes = readVibeTags(profile?.vibeTags);
  const likes = [...new Set([...(finder?.likes ?? []), ...vibeLikes(vibes)])];
  return { finder, likes, travel: { vibes, stay: profile?.travelStay ?? null, pace: profile?.travelPace ?? null, ...past } };
}

export async function loadFinder(userId: string): Promise<Finder | null> {
  return savedFinder((await getProfile(userId))?.exploreAnswers);
}

export async function saveFinder(userId: string, finder: Finder): Promise<void> {
  await ensureProfile(userId);
  await updateProfileFields(userId, { exploreAnswers: { finder: { ...finder, q: "" } } });
}
