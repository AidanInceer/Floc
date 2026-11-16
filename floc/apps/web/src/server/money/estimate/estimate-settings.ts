import "server-only";

import { canUseFeature } from "@/server/billing/entitlements";
import { readTravelProfile } from "@/server/money/estimate/estimate-store";
import { flightsSeenBy } from "@/server/money/estimate/flights-seen";
import { inferHomeAirport } from "@floc/core/money/estimate/guide/home-airport";
import { resolveStyle } from "@floc/core/money/estimate/style";
import type { EstimateSettings } from "@floc/core/money/estimate/view";

export async function readEstimateSettings(userId: string): Promise<EstimateSettings> {
  const [pro, travel] = await Promise.all([canUseFeature("money.estimate", userId), readTravelProfile(userId)]);
  const inferred = pro && !travel.homeAirport ? inferHomeAirport(await flightsSeenBy(userId)) : null;
  const { cabin, stay, pace } = resolveStyle(travel, {});
  return { pro, homeAirport: travel.homeAirport, inferred, style: { cabin, stay, pace } };
}
