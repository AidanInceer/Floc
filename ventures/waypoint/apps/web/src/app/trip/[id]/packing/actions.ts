"use server";

// Server actions for the packing tab — the shared list (ticket 219) and the
// personal one (ticket 220). Every line is resolved through
// `access.packingLine`, which refuses another member's personal line the same
// way it refuses a nonexistent id.
import { parsePackTier, parseQuantityStep, resolvePackTier } from "@/lib/packing";
import { capRequiredText } from "@/lib/text";
import { requireTripAccess } from "@/server/access";
import { ensureProfile } from "@/server/profile";
import { getPackTier, setPackTier } from "@/server/membership";
import { fillPersonalBag, packingPlanFor } from "@/server/packing-generator";
import {
  claimPackingLine,
  insertPackingLine,
  insertPersonalPackingLine,
  revalidatePacking,
  setClaimPacked,
  setPersonalPacked,
  stepPersonalQuantity,
  softDeletePackingLine,
  unclaimPackingLine,
} from "@/server/packing";

export async function addPackingLine(tripId: number, formData: FormData) {
  const access = await requireTripAccess(tripId);
  const label = capRequiredText(formData.get("label"), "packingLabel");
  if (!label) throw new Error("A thing to pack needs a name");

  await insertPackingLine(access.trip.id, access.viewer.id, label);

  revalidatePacking(access.trip.id);
}

// Both lists, with the resolver drawing the line: a shared line is anyone's to
// drop (the list is the group's, and one nobody wants shouldn't outlive
// whoever typed it), while a personal one only ever resolves for its owner.
export async function removePackingLine(tripId: number, lineId: number) {
  const access = await requireTripAccess(tripId);
  const line = await access.packingLine(lineId);

  await softDeletePackingLine(line.id);

  revalidatePacking(access.trip.id);
}

// Claiming is open by design: anyone may claim any line, and several people
// may claim the same one — two of you bringing sun cream is a real answer.
export async function setPackingClaim(
  tripId: number,
  lineId: number,
  claimed: boolean,
) {
  const access = await requireTripAccess(tripId);
  const line = await access.packingLine(lineId);

  if (claimed) await claimPackingLine(line.id, access.viewer.id);
  else await unclaimPackingLine(line.id, access.viewer.id);

  revalidatePacking(access.trip.id);
}

// Only your own claim. The write is scoped to (line, viewer), so ticking
// someone else's is not expressible rather than merely refused.
export async function setPackingPacked(
  tripId: number,
  lineId: number,
  packed: boolean,
) {
  const access = await requireTripAccess(tripId);
  const line = await access.packingLine(lineId);

  await setClaimPacked(line.id, access.viewer.id, packed);

  revalidatePacking(access.trip.id);
}

export async function addPersonalPackingLine(tripId: number, formData: FormData) {
  const access = await requireTripAccess(tripId);
  const label = capRequiredText(formData.get("label"), "packingLabel");
  if (!label) throw new Error("A thing to pack needs a name");

  await insertPersonalPackingLine(access.trip.id, access.viewer.id, label);

  revalidatePacking(access.trip.id);
}

// The resolver has already refused anything that isn't shared or yours, and
// the write is scoped to (line, viewer) on top — a shared line can't pick up a
// personal tick even if one were somehow reached.
export async function setPersonalPackingPacked(
  tripId: number,
  lineId: number,
  packed: boolean,
) {
  const access = await requireTripAccess(tripId);
  const line = await access.packingLine(lineId);

  await setPersonalPacked(line.id, access.viewer.id, packed);

  revalidatePacking(access.trip.id);
}

// A step, not a number: the row offers plus and minus, so the only two values
// worth accepting are the two it can send. The clamp lives in the SQL.
export async function stepPersonalPackingQuantity(
  tripId: number,
  lineId: number,
  formData: FormData,
) {
  const access = await requireTripAccess(tripId);
  const line = await access.packingLine(lineId);
  const delta = parseQuantityStep(formData.get("step"));
  if (!delta) throw new Error("That isn't a quantity step");

  await stepPersonalQuantity(line.id, access.viewer.id, delta);

  revalidatePacking(access.trip.id);
}

// This trip only. Writing the membership rather than the profile is the whole
// point: Light for one weekend must not become your default everywhere.
export async function setTripPackTier(tripId: number, formData: FormData) {
  const access = await requireTripAccess(tripId);
  const tier = parsePackTier(formData.get("packTier"));
  if (!tier) throw new Error("That isn't a packing style");

  await setPackTier(access.trip.id, access.viewer.id, tier);

  revalidatePacking(access.trip.id);
}

/**
 * Fill the bag from the trip's length, weather and tier (ticket 221). Always an
 * explicit press, and always additive — pressing it after a tier or date change
 * tops the list up rather than replacing it, so nothing you've edited is at
 * risk. The tier is re-resolved here rather than trusted from the form: the
 * page that rendered the button may be a stale tab.
 */
export async function fillMyPackingList(tripId: number) {
  const access = await requireTripAccess(tripId);

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

  revalidatePacking(access.trip.id);
}
