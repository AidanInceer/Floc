"use server";

import { redirect } from "next/navigation";

import {
  clampPackQuantity,
  parsePackCategory,
  parseQuantityStep,
} from "@floc/core/packing/packing";
import { capRequiredText } from "@floc/core/text/text";
import { requireUser } from "@/server/access";
import {
  insertPackingKit,
  insertPackingKitItem,
  renamePackingKit,
  softDeletePackingKit,
  softDeletePackingKitItem,
  stepPackingKitItemQuantity,
} from "@/server/packing/packing-kits";

export async function createPackingKit(formData: FormData) {
  const viewer = await requireUser("/lists/packing");
  const name = capRequiredText(formData.get("name"), "packingKitName");
  if (!name) return;

  const id = await insertPackingKit(viewer.id, name);

  if (id !== null) redirect(`/lists/packing#kit-${id}`);
}

export async function renameKit(kitId: number, formData: FormData) {
  const viewer = await requireUser("/lists/packing");
  const name = capRequiredText(formData.get("name"), "packingKitName");
  if (!name) return;

  await renamePackingKit(kitId, viewer.id, name);
}

export async function deleteKit(kitId: number) {
  const viewer = await requireUser("/lists/packing");

  await softDeletePackingKit(kitId, viewer.id);
}

export async function addKitItem(kitId: number, formData: FormData) {
  const viewer = await requireUser("/lists/packing");
  const label = capRequiredText(formData.get("label"), "packingLabel");
  if (!label) return;

  await insertPackingKitItem(
    kitId,
    viewer.id,
    label,
    parsePackCategory(formData.get("category")),
    clampPackQuantity(Number(formData.get("quantity") ?? 1)),
  );
}

export async function removeKitItem(itemId: number) {
  const viewer = await requireUser("/lists/packing");

  await softDeletePackingKitItem(itemId, viewer.id);
}

export async function stepKitItemQuantity(itemId: number, formData: FormData) {
  const viewer = await requireUser("/lists/packing");
  const delta = parseQuantityStep(formData.get("step"));
  if (!delta) throw new Error("That isn't a quantity step");

  await stepPackingKitItemQuantity(itemId, viewer.id, delta);
}
