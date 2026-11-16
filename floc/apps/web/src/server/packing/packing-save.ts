import "server-only";

import { Refusal } from "@floc/core/errors/refusal";
import { NO_PACK_LABEL, resolvePackTier, type PackCategory, type PackTier } from "@floc/core/packing/packing";
import { guessPackCategory } from "@floc/core/packing/packing-guess";
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
  softDeleteSuggestedLines,
  softDeleteWholeList,
  stepPersonalQuantity,
  unclaimPackingLine,
} from "@/server/packing/packing";
import { fillPersonalBag, packingPlanFor, takePackingIdea } from "@/server/packing/packing-generator";
import { applyPackingKitToBag } from "@/server/packing/packing-kits";

type Access = Pick<TripAccess, "trip" | "viewer" | "packingLine">;

const changed = (access: Access) => refresh({ kind: "packing", tripId: access.trip.id });

export async function addLine(access: Access, input: { label: unknown; category: PackCategory | null; mine: boolean }): Promise<Refusal | null> {
  const label = capRequiredText(input.label, "packingLabel");
  if (!label) return new Refusal(NO_PACK_LABEL);
  const insert = input.mine ? insertPersonalPackingLine : insertPackingLine;
  await insert(access.trip.id, access.viewer.id, label, input.category ?? guessPackCategory(label));
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

export async function removeLine(access: Access, lineId: number): Promise<void> {
  const line = await access.packingLine(lineId);
  await softDeletePackingLine(line.id, access.viewer.id);
  changed(access);
}

export async function removeLines(access: Access, lineIds: number[]): Promise<void> {
  if (lineIds.length === 0) return;
  const lines = await Promise.all(lineIds.map((id) => access.packingLine(id)));
  await softDeletePackingLines(lines.map((line) => line.id), access.viewer.id);
  changed(access);
}

export async function setClaim(access: Access, lineId: number, claimed: boolean): Promise<void> {
  const line = await access.packingLine(lineId);
  await (claimed ? claimPackingLine : unclaimPackingLine)(line.id, access.viewer.id);
  changed(access);
}

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

export async function resetList(access: Access, mine: boolean): Promise<void> {
  await softDeleteWholeList(access.trip.id, mine ? access.viewer.id : null, access.viewer.id);
  changed(access);
}

export async function setTier(access: Access, tier: PackTier): Promise<void> {
  await setPackTier(access.trip.id, access.viewer.id, tier);
  changed(access);
}

export async function fillBag(access: Access): Promise<void> {
  await fillPersonalBag(await fillArgs(access));
  changed(access);
}

export async function takeIdea(access: Access, label: string): Promise<void> {
  await takePackingIdea({ ...(await fillArgs(access)), label });
  changed(access);
}

export async function removeSuggested(access: Access): Promise<void> {
  await softDeleteSuggestedLines(access.trip.id, access.viewer.id);
  changed(access);
}

async function fillArgs(access: Access) {
  await assertFeature("packing.autoGenerate", access.trip.id);
  const [perTrip, profile] = await Promise.all([
    getPackTier(access.trip.id, access.viewer.id),
    ensureProfile(access.viewer.id),
  ]);
  return {
    tripId: access.trip.id,
    ownerId: access.viewer.id,
    tier: resolvePackTier(perTrip, profile.packTier),
    plan: await packingPlanFor(access.trip),
  };
}

export async function applyKit(access: Access, kitId: number): Promise<void> {
  await applyPackingKitToBag({ tripId: access.trip.id, ownerId: access.viewer.id, kitId });
  changed(access);
}
