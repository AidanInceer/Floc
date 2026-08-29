"use server";

// Server actions for the packing tab — the shared list (ticket 219) and the
// personal one (ticket 220). Every line is resolved through
// `access.packingLine`, which refuses another member's personal line the same
// way it refuses a nonexistent id.
import {
  parsePackCategory,
  parsePackTier,
  parseQuantityStep,
  resolvePackTier,
} from "@/lib/packing";
import { capRequiredText } from "@/lib/text";
import { requireTripAccess } from "@/server/access";
import { LIMITS } from "@/server/limits";
import { ensureProfile } from "@/server/profile";
import { getPackTier, setPackTier } from "@/server/membership";
import { fillPersonalBag, packingPlanFor } from "@/server/packing-generator";
import { applyPackingKitToBag } from "@/server/packing-kits";
import {
  claimPackingLine,
  insertPackingLine,
  insertPersonalPackingLine,
  setClaimPacked,
  setPersonalPacked,
  stepPersonalQuantity,
  softDeletePackingLine,
  softDeletePackingLines,
  softDeleteWholeList,
  unclaimPackingLine,
} from "@/server/packing";
import { refresh } from "@/server/freshness";

export async function addPackingLine(tripId: number, formData: FormData) {
  const access = await requireTripAccess(tripId);
  const label = capRequiredText(formData.get("label"), "packingLabel");
  if (!label) throw new Error("A thing to pack needs a name");

  await insertPackingLine(
    access.trip.id,
    access.viewer.id,
    label,
    parsePackCategory(formData.get("category")),
  );

  refresh({ kind: "packing", tripId: access.trip.id });
}

// Both lists, with the resolver drawing the line: a shared line is anyone's to
// drop (the list is the group's, and one nobody wants shouldn't outlive
// whoever typed it), while a personal one only ever resolves for its owner.
export async function removePackingLine(tripId: number, lineId: number) {
  const access = await requireTripAccess(tripId);
  const line = await access.packingLine(lineId);

  await softDeletePackingLine(line.id);

  refresh({ kind: "packing", tripId: access.trip.id });
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

  refresh({ kind: "packing", tripId: access.trip.id });
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

  refresh({ kind: "packing", tripId: access.trip.id });
}

export async function addPersonalPackingLine(tripId: number, formData: FormData) {
  const access = await requireTripAccess(tripId);
  const label = capRequiredText(formData.get("label"), "packingLabel");
  if (!label) throw new Error("A thing to pack needs a name");

  await insertPersonalPackingLine(
    access.trip.id,
    access.viewer.id,
    label,
    parsePackCategory(formData.get("category")),
  );

  refresh({ kind: "packing", tripId: access.trip.id });
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

  refresh({ kind: "packing", tripId: access.trip.id });
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

  refresh({ kind: "packing", tripId: access.trip.id });
}

// This trip only. Writing the membership rather than the profile is the whole
// point: Light for one weekend must not become your default everywhere.
export async function setTripPackTier(tripId: number, formData: FormData) {
  const access = await requireTripAccess(tripId);
  const tier = parsePackTier(formData.get("packTier"));
  if (!tier) throw new Error("That isn't a packing style");

  await setPackTier(access.trip.id, access.viewer.id, tier);

  refresh({ kind: "packing", tripId: access.trip.id });
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

  refresh({ kind: "packing", tripId: access.trip.id });
}

/**
 * Remove everything ticked, in one press (ticket 229). Every id is still
 * resolved through `access.packingLine` one at a time — the bulk shape is a
 * convenience for the person, never a way round the per-line check, so a set
 * containing somebody else's personal line is refused whole rather than
 * quietly filtered down to the allowed part.
 */
export async function removePackingLines(tripId: number, formData: FormData) {
  const access = await requireTripAccess(tripId);

  // Capped like every read of this table: the tick boxes can only ever offer
  // what a list holds, so anything past that came from a hand-made POST and is
  // a request to open one round-trip per id.
  const ids = formData
    .getAll("lineId")
    .map((v) => Number(v))
    .filter((n) => Number.isInteger(n) && n > 0)
    .slice(0, LIMITS.packingLines);
  if (ids.length === 0) return;

  const lines = await Promise.all(ids.map((id) => access.packingLine(id)));

  await softDeletePackingLines(lines.map((l) => l.id));

  refresh({ kind: "packing", tripId: access.trip.id });
}

/**
 * Wipe a whole list. `mine` picks which one, and it is the only input — the
 * scope is decided here and applied in the SQL, so "clear my bag" can never be
 * spelled as "clear someone else's". The shared list is the group's, so anyone
 * on the trip may reset it, exactly as anyone may remove a single line from it.
 */
export async function resetPackingList(
  tripId: number,
  mine: boolean,
) {
  const access = await requireTripAccess(tripId);

  await softDeleteWholeList(access.trip.id, mine ? access.viewer.id : null);

  refresh({ kind: "packing", tripId: access.trip.id });
}

/**
 * Copy one of your saved lists into your bag on this trip (ticket 230).
 * Additive and idempotent — a label already in the bag is left as it is, so
 * pressing it twice never doubles a row you had already tuned. The kit is
 * resolved by owner, so another account's list is not addressable here.
 */
export async function applyPackingKit(tripId: number, kitId: number) {
  const access = await requireTripAccess(tripId);

  await applyPackingKitToBag({
    tripId: access.trip.id,
    ownerId: access.viewer.id,
    kitId,
  });

  refresh({ kind: "packing", tripId: access.trip.id });
}
