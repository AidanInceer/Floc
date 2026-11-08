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

/**
 * The Packing page's whole read, for the web page and the phone alike, so the
 * first-open fill (ticket 221) happens wherever the bag is opened first.
 */
export async function readPackingBoard(
  trip: { id: number; startDate: string | null; endDate: string | null },
  viewerId: string,
) {
  const [lines, claims, settings, profile, plan, kits, bag, packingPro] = await Promise.all([
    listPackingLines(trip.id),
    listPackingClaims(trip.id),
    getPackSettings(trip.id, viewerId),
    ensureProfile(viewerId),
    packingPlanFor(trip, viewerId),
    listPackingKits(viewerId),
    listPersonalPackingLines(trip.id, viewerId),
    canUseFeature("packing.autoGenerate", viewerId),
  ]);
  const tier = resolvePackTier(settings.tier, profile.packTier);

  // Why: the flag is the fill's own one-shot mark, claimed in the same
  // transaction as the insert, so emptying your bag does not invite it back.
  // Reading it here rather than letting the fill no-op keeps a write
  // transaction off every open (ticket 231).
  let mine = bag;
  if (packingPro && profile.packAutoGenerate && settings.generatedAt === null) {
    await autoFillPersonalBag({ tripId: trip.id, ownerId: viewerId, tier, plan });
    // Re-read whether or not this call added anything: losing the write lock to
    // the request that filled the bag also reports zero.
    mine = await listPersonalPackingLines(trip.id, viewerId);
  }

  const ideas = packingPro
    ? packingIdeas({ nights: plan.nights, climate: plan.climate, tier }, mine.map((l) => l.label))
    : [];
  return { lines, claims, mine, kits, tier, plan, packingPro, ideas };
}
