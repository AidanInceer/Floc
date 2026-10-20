import "server-only";

import type { Finder } from "@floc/core/trip/explore/finder/finder";
import { savedFinder } from "@floc/core/trip/explore/finder/finder-read";

import { ensureProfile, getProfile, updateProfileFields } from "@/server/auth/profile";

export async function loadFinder(userId: string): Promise<Finder | null> {
  const profile = await getProfile(userId);
  return savedFinder(profile?.exploreAnswers);
}

// Why: a search is for this visit; coming back to last week's typed word would look like a bug.
export async function saveFinder(userId: string, finder: Finder): Promise<void> {
  await ensureProfile(userId);
  await updateProfileFields(userId, { exploreAnswers: { finder: { ...finder, q: "" } } });
}
