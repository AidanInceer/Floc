import "server-only";

import { savedFilter, withFilter, type ExploreFilter } from "@floc/core/trip/explore/explore-filter";

import { ensureProfile, getProfile, updateProfileFields } from "@/server/auth/profile";

export async function loadFilter(userId: string): Promise<ExploreFilter | null> {
  const profile = await getProfile(userId);
  return savedFilter(profile?.exploreAnswers);
}

export async function saveFilter(userId: string, filter: ExploreFilter): Promise<void> {
  await ensureProfile(userId);
  const profile = await getProfile(userId);
  await updateProfileFields(userId, { exploreAnswers: withFilter(profile?.exploreAnswers, filter) });
}
