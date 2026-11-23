import "server-only";

import type { Finder } from "@floc/core/trip/explore/finder/finder";
import { savedFinder } from "@floc/core/trip/explore/finder/finder-read";
import type { TripTag } from "@floc/core/trip/explore/finder/tag-groups";
import { vibeLikes } from "@floc/core/trip/explore/finder/vibe-likes";
import type { TravelProfile } from "@floc/core/trip/explore/fit/travel-profile";
import { readVibeTags } from "@floc/core/trip/vibe-tags";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { user, userProfile, userTravelStyle } from "@/db/schema";
import { ensureProfile, getProfile, updateProfileFields } from "@/server/auth/profile";
import { loadPastTravel } from "@/server/explore/travel-read";

export type ExploreTaste = { finder: Finder | null; likes: TripTag[]; travel: TravelProfile };

export async function loadTaste(userId: string): Promise<ExploreTaste> {
  const [told, past] = await Promise.all([whatTheyTold(userId), loadPastTravel(userId)]);
  const finder = savedFinder(told?.exploreAnswers);
  const vibes = readVibeTags(told?.vibeTags);
  const likes = [...new Set([...(finder?.likes ?? []), ...vibeLikes(vibes)])];
  return { finder, likes, travel: { vibes, stay: told?.stay ?? null, pace: told?.pace ?? null, ...past } };
}

function whatTheyTold(userId: string) {
  return db
    .select({
      exploreAnswers: userProfile.exploreAnswers,
      vibeTags: userProfile.vibeTags,
      stay: userTravelStyle.travelStay,
      pace: userTravelStyle.travelPace,
    })
    .from(user)
    .leftJoin(userProfile, eq(userProfile.userId, user.id))
    .leftJoin(userTravelStyle, eq(userTravelStyle.userId, user.id))
    .where(eq(user.id, userId))
    .get();
}

export async function loadFinder(userId: string): Promise<Finder | null> {
  return savedFinder((await getProfile(userId))?.exploreAnswers);
}

export async function saveFinder(userId: string, finder: Finder): Promise<void> {
  await ensureProfile(userId);
  await updateProfileFields(userId, { exploreAnswers: { finder: { ...finder, q: "" } } });
}
