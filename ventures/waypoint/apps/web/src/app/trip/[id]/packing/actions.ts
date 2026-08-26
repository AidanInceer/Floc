"use server";

// Server actions for the shared packing list (ticket 219).
import { capRequiredText } from "@/lib/text";
import { requireTripAccess } from "@/server/access";
import {
  claimPackingLine,
  insertPackingLine,
  revalidatePacking,
  setClaimPacked,
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

// Any member, not author-or-admin: the shared list is the group's, and a line
// nobody wants shouldn't outlive whoever typed it.
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
