"use server";

// Server actions for the packing tab — the shared list (ticket 219) and the
// personal one (ticket 220). Each reads the form and calls `server/packing/packing-save`,
// the same writes the phone reaches through the port.
import { parsePackCategory, parsePackTier, parseQuantityStep } from "@floc/core/packing/packing";
import { requireTripAccess } from "@/server/access";
import { LIMITS } from "@/server/limits";
import {
  addLine,
  applyKit,
  fillBag,
  removeLine,
  removeLines,
  renameLine,
  resetList,
  setClaim,
  setPacked,
  setTier,
  stepQuantity,
} from "@/server/packing/packing-save";

async function addFromForm(tripId: number, formData: FormData, mine: boolean) {
  const refusal = await addLine(await requireTripAccess(tripId), {
    label: formData.get("label"),
    category: parsePackCategory(formData.get("category")),
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
  const refusal = await renameLine(await requireTripAccess(tripId), lineId, rawLabel);
  return refusal ? { error: refusal.message } : {};
}

export async function removePackingLine(tripId: number, lineId: number) {
  await removeLine(await requireTripAccess(tripId), lineId);
}

export async function setPackingClaim(tripId: number, lineId: number, claimed: boolean) {
  await setClaim(await requireTripAccess(tripId), lineId, claimed);
}

export async function setPackingPacked(tripId: number, lineId: number, packed: boolean) {
  await setPacked(await requireTripAccess(tripId), lineId, packed);
}

export async function setPersonalPackingPacked(tripId: number, lineId: number, packed: boolean) {
  await setPacked(await requireTripAccess(tripId), lineId, packed);
}

// A step, not a number: the row offers plus and minus, so those are the only two values accepted.
export async function stepPersonalPackingQuantity(tripId: number, lineId: number, formData: FormData) {
  const delta = parseQuantityStep(formData.get("step"));
  if (!delta) throw new Error("That isn't a quantity step");
  await stepQuantity(await requireTripAccess(tripId), lineId, delta);
}

export async function setTripPackTier(tripId: number, formData: FormData) {
  const tier = parsePackTier(formData.get("packTier"));
  if (!tier) throw new Error("That isn't a packing style");
  await setTier(await requireTripAccess(tripId), tier);
}

export async function fillMyPackingList(tripId: number) {
  await fillBag(await requireTripAccess(tripId));
}

// Why the cap: the tick boxes can only offer what a list holds, so more came from a
// hand-made POST asking for one round trip per id (ticket 229).
export async function removePackingLines(tripId: number, formData: FormData) {
  const ids = formData
    .getAll("lineId")
    .map((v) => Number(v))
    .filter((n) => Number.isInteger(n) && n > 0)
    .slice(0, LIMITS.packingLines);
  await removeLines(await requireTripAccess(tripId), ids);
}

export async function resetPackingList(tripId: number, mine: boolean) {
  await resetList(await requireTripAccess(tripId), mine);
}

export async function applyPackingKit(tripId: number, kitId: number) {
  await applyKit(await requireTripAccess(tripId), kitId);
}
