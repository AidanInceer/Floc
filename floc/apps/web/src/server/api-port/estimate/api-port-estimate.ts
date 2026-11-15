import "server-only";

import type { FlocPort } from "@floc/api/port";

import { scoped } from "@/server/api-port/api-port-scope";
import { canUseFeature } from "@/server/billing/entitlements";
import { saveBudget, saveOwnLine, saveTravelProfile, saveTripNights, saveTripStyle } from "@/server/money/estimate/estimate-save";
import { readEstimateSettings } from "@/server/money/estimate/estimate-settings";
import { readEstimate } from "@/server/money/estimate/estimate-view";

type EstimatePort = Pick<
  FlocPort,
  "loadEstimate" | "setEstimateBudget" | "setEstimateLine" | "setEstimateStyle" | "setEstimateNights" | "loadEstimateSettings" | "setEstimateSettings"
>;

/** The phone's door to your own estimate (#574): the same reads and gated writes as the web's Budget view. */
export const estimatePort: EstimatePort = {
  async loadEstimate(viewerId, tripId) {
    const access = await scoped(viewerId, tripId);
    const pro = await canUseFeature("money.estimate", viewerId);
    return { pro, view: pro ? await readEstimate(access.trip, viewerId) : null };
  },
  async setEstimateBudget(viewerId, tripId, amountMinor) {
    await saveBudget(await scoped(viewerId, tripId), amountMinor);
  },
  async setEstimateLine(viewerId, tripId, line, patch) {
    await saveOwnLine(await scoped(viewerId, tripId), line, patch);
  },
  async setEstimateStyle(viewerId, tripId, choice) {
    await saveTripStyle(await scoped(viewerId, tripId), choice);
  },
  async setEstimateNights(viewerId, tripId, nights) {
    await saveTripNights(await scoped(viewerId, tripId), nights);
  },
  loadEstimateSettings: (viewerId) => readEstimateSettings(viewerId),
  setEstimateSettings: (viewerId, patch) => saveTravelProfile(viewerId, patch),
};
