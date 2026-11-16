import "server-only";

import { resolvePackTier } from "@floc/core/packing/packing";
import { packingIdeas } from "@floc/core/packing/packing-ideas";
import { ensureProfile } from "@/server/auth/profile";
import { canUseFeature } from "@/server/billing/entitlements";
import {
  getPackSettings,
  listPackingClaims,
  listPackingLines,
  listPersonalPackingLines,
} from "@/server/packing/packing";
import { autoFillPersonalBag, packingPlanFor } from "@/server/packing/packing-generator";
import { listPackingKits } from "@/server/packing/packing-kits";

export async function readPackingBoard(
  trip: { id: number; startDate: string | null; endDate: string | null },
  viewerId: string,
) {
  const [lines, claims, settings, profile, plan, kits, bag, packingPro] = await Promise.all([
    listPackingLines(trip.id),
    listPackingClaims(trip.id),
    getPackSettings(trip.id, viewerId),
    ensureProfile(viewerId),
    packingPlanFor(trip),
    listPackingKits(viewerId),
    listPersonalPackingLines(trip.id, viewerId),
    canUseFeature("packing.autoGenerate", trip.id),
  ]);
  const tier = resolvePackTier(settings.tier, profile.packTier);

  let mine = bag;
  if (packingPro && profile.packAutoGenerate && settings.generatedAt === null) {
    await autoFillPersonalBag({ tripId: trip.id, ownerId: viewerId, tier, plan });
    mine = await listPersonalPackingLines(trip.id, viewerId);
  }

  const ideas = packingPro
    ? packingIdeas({ nights: plan.nights, climate: plan.climate, tier }, mine.map((l) => l.label))
    : [];
  return { lines, claims, mine, kits, tier, plan, packingPro, ideas };
}
