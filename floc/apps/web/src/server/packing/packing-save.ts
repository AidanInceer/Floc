/**
 * Writing packing, from the web page or the phone: the door resolves access,
 * and everything after it happens here once. A line is always resolved through
 * `access.packingLine`, which refuses another member's personal line the same
 * way it refuses a nonexistent id (#220).
 */
import "server-only";

import { Refusal } from "@floc/core/errors/refusal";
import { NO_PACK_LABEL, resolvePackTier, type PackCategory, type PackTier } from "@floc/core/packing/packing";
import { capRequiredText } from "@floc/core/text/text";

import type { TripAccess } from "@/server/access";
import { ensureProfile } from "@/server/auth/profile";
import { assertFeature } from "@/server/billing/entitlements";
import { refresh } from "@/server/freshness";
import {
  claimPackingLine,
  getPackTier,
  insertPackingLine,
  insertPersonalPackingLine,
  renamePackingLineLabel,
  setClaimPacked,
  setPackTier,
  setPersonalPacked,
  softDeletePackingLine,
  softDeletePackingLines,
  softDeleteWholeList,
  stepPersonalQuantity,
  unclaimPackingLine,
} from "@/server/packing/packing";
import { fillPersonalBag, packingPlanFor } from "@/server/packing/packing-generator";
import { applyPackingKitToBag } from "@/server/packing/packing-kits";

type Access = Pick<TripAccess, "trip" | "viewer" | "packingLine">;

const changed = (access: Access) => refresh({ kind: "packing", tripId: access.trip.id });

/** `mine` puts it in the viewer's own bag; author and owner are the same person by construction. */
export async function addLine(access: Access, input: { label: unknown; category: PackCategory; mine: boolean }): Promise<Refusal | null> {
  const label = capRequiredText(input.label, "packingLabel");
  if (!label) return new Refusal(NO_PACK_LABEL);
  const insert = input.mine ? insertPersonalPackingLine : insertPackingLine;
  await insert(access.trip.id, access.viewer.id, label, input.category);
  changed(access);
  return null;
}

export async function renameLine(access: Access, lineId: number, rawLabel: string): Promise<Refusal | null> {
  const line = await access.packingLine(lineId);
  const label = capRequiredText(rawLabel, "packingLabel");
  if (!label) return new Refusal(NO_PACK_LABEL);
  await renamePackingLineLabel(line.id, label);
  changed(access);
  return null;
}

// A shared line is anyone's to drop: the list is the group's.
export async function removeLine(access: Access, lineId: number): Promise<void> {
  const line = await access.packingLine(lineId);
  await softDeletePackingLine(line.id, access.viewer.id);
  changed(access);
}

// One resolve per id, not a filtered `IN`: a set holding somebody else's personal line throws whole (#229).
export async function removeLines(access: Access, lineIds: number[]): Promise<void> {
  if (lineIds.length === 0) return;
  const lines = await Promise.all(lineIds.map((id) => access.packingLine(id)));
  await softDeletePackingLines(lines.map((line) => line.id), access.viewer.id);
  changed(access);
}

// Claiming is open: several people may claim the same line.
export async function setClaim(access: Access, lineId: number, claimed: boolean): Promise<void> {
  const line = await access.packingLine(lineId);
  await (claimed ? claimPackingLine : unclaimPackingLine)(line.id, access.viewer.id);
  changed(access);
}

// A shared line's tick belongs to the viewer's claim, a personal line's to the line itself.
export async function setPacked(access: Access, lineId: number, packed: boolean): Promise<void> {
  const line = await access.packingLine(lineId);
  await (line.ownerId === null ? setClaimPacked : setPersonalPacked)(line.id, access.viewer.id, packed);
  changed(access);
}

export async function stepQuantity(access: Access, lineId: number, delta: 1 | -1): Promise<void> {
  const line = await access.packingLine(lineId);
  await stepPersonalQuantity(line.id, access.viewer.id, delta);
  changed(access);
}

// The scope is applied in the SQL, so "clear my bag" cannot be spelled as "clear someone else's".
export async function resetList(access: Access, mine: boolean): Promise<void> {
  await softDeleteWholeList(access.trip.id, mine ? access.viewer.id : null, access.viewer.id);
  changed(access);
}

// The membership row, not the profile: Light for one weekend must not become the default (#220).
export async function setTier(access: Access, tier: PackTier): Promise<void> {
  await setPackTier(access.trip.id, access.viewer.id, tier);
  changed(access);
}

/**
 * Why: Pro buys the action, never the data (#248). The tier is resolved again here,
 * since the screen that drew the button may be a stale tab. Always additive (#221).
 */
export async function fillBag(access: Access): Promise<void> {
  await assertFeature("packing.autoGenerate", access.trip.id);
  const [perTrip, profile] = await Promise.all([
    getPackTier(access.trip.id, access.viewer.id),
    ensureProfile(access.viewer.id),
  ]);
  await fillPersonalBag({
    tripId: access.trip.id,
    ownerId: access.viewer.id,
    tier: resolvePackTier(perTrip, profile.packTier),
    plan: await packingPlanFor(access.trip),
  });
  changed(access);
}

// Additive and idempotent; the kit is resolved by owner, so another account's is not addressable (#230).
export async function applyKit(access: Access, kitId: number): Promise<void> {
  await applyPackingKitToBag({ tripId: access.trip.id, ownerId: access.viewer.id, kitId });
  changed(access);
}
