import "server-only";

import type { Currency } from "@floc/core/money/currency";
import { welcomeDue, type WelcomeAnswers } from "@floc/core/people/welcome/welcome";
import { readVibeTags } from "@floc/core/trip/vibe-tags";

import { ensureProfile, updateProfileFields } from "@/server/auth/profile";
import { markTourSeen } from "@/server/auth/tour";
import { readTravelStyle, saveTravelStyle } from "@/server/auth/travel-style";

export type WelcomeState = {
  due: boolean;
  currency: Currency;
  answers: WelcomeAnswers;
};

export async function welcomeFor(userId: string): Promise<WelcomeState> {
  const [profile, style] = await Promise.all([ensureProfile(userId), readTravelStyle(userId)]);
  return {
    due: welcomeDue({ seenAt: profile.tourSeenAt }),
    currency: profile.homeCurrency,
    answers: {
      homeAirport: style.homeAirport ?? undefined,
      travelCabin: style.travelCabin ?? undefined,
      travelStay: style.travelStay ?? undefined,
      travelPace: style.travelPace ?? undefined,
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
  const { vibeTags, homeCurrency, ...style } = answers;
  const identity = { ...(vibeTags !== undefined && { vibeTags }), ...(homeCurrency !== undefined && { homeCurrency }) };
  if (Object.keys(identity).length > 0) await updateProfileFields(userId, identity);
  if (Object.keys(style).length > 0) await saveTravelStyle(userId, style);
  await markTourSeen(userId);
}
