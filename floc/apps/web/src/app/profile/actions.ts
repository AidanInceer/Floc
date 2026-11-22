"use server";

import { CURRENCIES } from "@/db/schema";
import type { Currency } from "@/db/schema";
import { requireUser } from "@/server/access";
import { parseAvatarIcon } from "@floc/core/people/avatar-icon";
import { capText } from "@floc/core/text/text";
import { parsePackTier } from "@floc/core/packing/packing";
import { saveFace, saveProfile } from "@/server/auth/profile";
import { markCountry } from "@/server/itinerary/travel-map";
import { parseVibeTags } from "@floc/core/trip/vibe-tags";

export async function updateFace(formData: FormData): Promise<{ error?: string }> {
  const viewer = await requireUser();

  const displayName = capText(formData.get("displayName"), "displayName");
  if (!displayName) return { error: "Give yourself a name." };

  await saveFace(viewer.id, {
    displayName,
    avatarIcon: parseAvatarIcon(formData.get("avatarIcon")),
  });
  return {};
}

export async function updateCurrency(formData: FormData): Promise<{ error?: string }> {
  const viewer = await requireUser();

  const homeCurrency = String(formData.get("homeCurrency") ?? "GBP") as Currency;
  if (!CURRENCIES.includes(homeCurrency)) {
    return { error: "Pick a currency Floc supports." };
  }

  await saveProfile(viewer.id, { homeCurrency });
  return {};
}

export async function updateVibeTags(formData: FormData): Promise<{ error?: string }> {
  const viewer = await requireUser();

  const picked = parseVibeTags(formData.getAll("vibeTag").map(String));

  await saveProfile(viewer.id, { vibeTags: picked.length ? picked : null });
  return {};
}

export async function updatePacking(formData: FormData): Promise<{ error?: string }> {
  const viewer = await requireUser();

  const packTier = parsePackTier(formData.get("packTier"));
  if (!packTier) return { error: "Pick a packing style." };

  await saveProfile(viewer.id, { packTier });
  return {};
}

export async function setReduceMotion(reduceMotion: boolean): Promise<void> {
  const viewer = await requireUser();
  await saveProfile(viewer.id, { reduceMotion });
}

export async function updateMotion(formData: FormData): Promise<{ error?: string }> {
  await setReduceMotion(formData.get("reduceMotion") === "on");
  return {};
}

export async function setCountryMark(
  code: string,
  next: "green" | "yellow" | "blank",
): Promise<void> {
  const viewer = await requireUser();
  await markCountry(viewer.id, code, next);
}
