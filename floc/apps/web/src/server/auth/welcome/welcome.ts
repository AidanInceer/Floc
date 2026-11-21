import "server-only";

import type { Currency } from "@floc/core/money/currency";
import { welcomeDue, type WelcomeAnswers } from "@floc/core/people/welcome/welcome";
import { readVibeTags } from "@floc/core/trip/vibe-tags";

import { ensureProfile, updateProfileFields } from "@/server/auth/profile";
import { markTourSeen } from "@/server/auth/tour";

export type WelcomeState = {
  due: boolean;
  currency: Currency;
  answers: WelcomeAnswers;
};

export async function welcomeFor(userId: string): Promise<WelcomeState> {
  const profile = await ensureProfile(userId);
  return {
    due: welcomeDue({ seenAt: profile.tourSeenAt }),
    currency: profile.homeCurrency,
    answers: {
      homeAirport: profile.homeAirport ?? undefined,
      travelCabin: profile.travelCabin ?? undefined,
      travelStay: profile.travelStay ?? undefined,
      travelPace: profile.travelPace ?? undefined,
      vibeTags: readVibeTags(profile.vibeTags),
    },
  };
}

export async function seedWelcomeCurrency(userId: string, guess: Currency): Promise<void> {
  const profile = await ensureProfile(userId);
  if (!welcomeDue({ seenAt: profile.tourSeenAt }) || profile.homeCurrency === guess) return;
  await updateProfileFields(userId, { homeCurrency: guess });
}

export async function finishWelcome(userId: string, answers: WelcomeAnswers): Promise<void> {
  await ensureProfile(userId);
  if (Object.keys(answers).length > 0) await updateProfileFields(userId, answers);
  await markTourSeen(userId);
}
