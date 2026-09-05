"use server";

// Saved packing lists (ticket 230). Not a trip surface, so there is no
// `requireTripAccess` here — `requireUser` plus owner-scoped writes is the
// whole of the access rule, and every write in `server/packing-kits` carries
// the owner rather than trusting a resolved id.
import { redirect } from "next/navigation";

import {
  clampPackQuantity,
  parsePackCategory,
  parseQuantityStep,
} from "@floc/core/packing";
import { capRequiredText } from "@floc/core/text";
import { requireUser } from "@/server/access";
import {
  insertPackingKit,
  insertPackingKitItem,
  renamePackingKit,
  softDeletePackingKit,
  softDeletePackingKitItem,
  stepPackingKitItemQuantity,
} from "@/server/packing-kits";
import { refresh } from "@/server/freshness";

export async function createPackingKit(formData: FormData) {
  const viewer = await requireUser("/packing-lists");
  const name = capRequiredText(formData.get("name"), "packingKitName");
  if (!name) throw new Error("A saved list needs a name");

  const id = await insertPackingKit(viewer.id, name);

  refresh({ kind: "packingKits" });
  // Straight into the new list, because a list with no things in it is not
  // what you came to make.
  if (id !== null) redirect(`/packing-lists#kit-${id}`);
}

export async function renameKit(kitId: number, formData: FormData) {
  const viewer = await requireUser("/packing-lists");
  const name = capRequiredText(formData.get("name"), "packingKitName");
  if (!name) throw new Error("A saved list needs a name");

  await renamePackingKit(kitId, viewer.id, name);

  refresh({ kind: "packingKits" });
}

export async function deleteKit(kitId: number) {
  const viewer = await requireUser("/packing-lists");

  await softDeletePackingKit(kitId, viewer.id);

  refresh({ kind: "packingKits" });
}

export async function addKitItem(kitId: number, formData: FormData) {
  const viewer = await requireUser("/packing-lists");
  const label = capRequiredText(formData.get("label"), "packingLabel");
  if (!label) throw new Error("A thing to pack needs a name");

  await insertPackingKitItem(
    kitId,
    viewer.id,
    label,
    parsePackCategory(formData.get("category")),
    clampPackQuantity(Number(formData.get("quantity") ?? 1)),
  );

  refresh({ kind: "packingKits" });
}

export async function removeKitItem(itemId: number) {
  const viewer = await requireUser("/packing-lists");

  await softDeletePackingKitItem(itemId, viewer.id);

  refresh({ kind: "packingKits" });
}

export async function stepKitItemQuantity(itemId: number, formData: FormData) {
  const viewer = await requireUser("/packing-lists");
  const delta = parseQuantityStep(formData.get("step"));
  if (!delta) throw new Error("That isn't a quantity step");

  await stepPackingKitItemQuantity(itemId, viewer.id, delta);

  refresh({ kind: "packingKits" });
}
