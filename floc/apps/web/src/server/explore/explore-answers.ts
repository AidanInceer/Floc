import "server-only";

import { readAnswers, type ExploreAnswers } from "@floc/core/trip/explore/explore-match";

import { ensureProfile, getProfile, updateProfileFields } from "@/server/auth/profile";

export async function loadAnswers(userId: string): Promise<ExploreAnswers | null> {
  const profile = await getProfile(userId);
  return readAnswers(profile?.exploreAnswers);
}

export async function saveAnswers(userId: string, answers: ExploreAnswers): Promise<void> {
  await ensureProfile(userId);
  await updateProfileFields(userId, { exploreAnswers: answers });
}
