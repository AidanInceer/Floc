"use server";

import { parsePackCategory, parsePackTier, parseQuantityStep } from "@floc/core/packing/packing";
import { requireTripAccess } from "@/server/access";
import { LIMITS } from "@/server/limits";
import {
  addLine,
  applyKit,
  fillBag,
  removeLine,
  removeLines,
  removeSuggested,
  renameLine,
  resetList,
  setClaim,
  setPacked,
  setTier,
  stepQuantity,
  takeIdea,
} from "@/server/packing/packing-save";
import { editTrip } from "@/server/trip-edit";

async function addFromForm(tripId: number, formData: FormData, mine: boolean) {
  const refusal = await addLine(await requireTripAccess(tripId), {
    label: formData.get("label"),
    category: formData.has("category") ? parsePackCategory(formData.get("category")) : null,
    mine,
  });
  if (refusal) throw refusal;
}

export async function addPackingLine(tripId: number, formData: FormData) {
  await addFromForm(tripId, formData, false);
}

export async function addPersonalPackingLine(tripId: number, formData: FormData) {
  await addFromForm(tripId, formData, true);
}

export async function renamePackingLine(
  tripId: number,
  lineId: number,
  rawLabel: string,
): Promise<{ error?: string }> {
  const refusal = await editTrip(tripId, "packing", (access) => renameLine(access, lineId, rawLabel));
  return refusal ? { error: refusal.message } : {};
}

export async function removePackingLine(tripId: number, lineId: number) {
  await editTrip(tripId, "packing", (access) => removeLine(access, lineId));
}

export async function setPackingClaim(tripId: number, lineId: number, claimed: boolean) {
  await editTrip(tripId, "packing", (access) => setClaim(access, lineId, claimed));
}

export async function setPackingPacked(tripId: number, lineId: number, packed: boolean) {
  await editTrip(tripId, "packing", (access) => setPacked(access, lineId, packed));
}

export async function setPersonalPackingPacked(tripId: number, lineId: number, packed: boolean) {
  await editTrip(tripId, "packing", (access) => setPacked(access, lineId, packed));
}

export async function stepPersonalPackingQuantity(tripId: number, lineId: number, formData: FormData) {
  const delta = parseQuantityStep(formData.get("step"));
  if (!delta) throw new Error("That isn't a quantity step");
  await editTrip(tripId, "packing", (access) => stepQuantity(access, lineId, delta));
}

export async function setTripPackTier(tripId: number, formData: FormData) {
  const tier = parsePackTier(formData.get("packTier"));
  if (!tier) throw new Error("That isn't a packing style");
  await setTier(await requireTripAccess(tripId), tier);
}

export async function fillMyPackingList(tripId: number) {
  await fillBag(await requireTripAccess(tripId));
}

export async function takePackingIdea(tripId: number, label: string) {
  await takeIdea(await requireTripAccess(tripId), label);
}

export async function removeSuggestedPackingLines(tripId: number) {
  await removeSuggested(await requireTripAccess(tripId));
}

export async function removePackingLines(tripId: number, formData: FormData) {
  const ids = formData
    .getAll("lineId")
    .map((v) => Number(v))
    .filter((n) => Number.isInteger(n) && n > 0)
    .slice(0, LIMITS.packingLines);
  await editTrip(tripId, "packing", (access) => removeLines(access, ids));
}

export async function resetPackingList(tripId: number, mine: boolean) {
  await resetList(await requireTripAccess(tripId), mine);
}

export async function applyPackingKit(tripId: number, kitId: number) {
  await applyKit(await requireTripAccess(tripId), kitId);
}
