import "server-only";

import type { Currency } from "@floc/core/money/currency";
import type { RatesToHome } from "@floc/core/trip/explore/explore-sort";

import { getProfile } from "@/server/auth/profile";
import { getHomeRates } from "@/server/money/fx";

export async function loadExploreRates(userId: string | null): Promise<RatesToHome | null> {
  const profile = userId ? await getProfile(userId) : undefined;
  const home: Currency = profile?.homeCurrency ?? "GBP";
  return (await getHomeRates(home))?.toHome ?? null;
}
