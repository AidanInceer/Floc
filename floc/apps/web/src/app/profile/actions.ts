"use server";

import { CURRENCIES } from "@/db/schema";
import type { Currency } from "@/db/schema";
import { requireUser } from "@/server/access";
import { parseAvatarIcon } from "@floc/core/people/avatar-icon";
import { readCountryCode } from "@floc/core/people/countries";
import { capText } from "@floc/core/text/text";
import { parsePackTier } from "@floc/core/packing/packing";
import {
  ensureProfile,
  updateProfileFields,
} from "@/server/auth/profile";
import {
  clearManualMark,
  derivedStateFor,
  setManualMark,
} from "@/server/itinerary/travel-map";
import { parseVibeTags } from "@floc/core/trip/vibe-tags";
import { refresh } from "@/server/freshness";

export async function updateFace(formData: FormData): Promise<{ error?: string }> {
  const viewer = await requireUser();

  const displayName = capText(formData.get("displayName"), "displayName");
  if (!displayName) return { error: "Give yourself a name." };

  await ensureProfile(viewer.id);
  await updateProfileFields(viewer.id, {
    displayName,
    avatarIcon: parseAvatarIcon(formData.get("avatarIcon")),
  });

  refresh({ kind: "profile" });
  refresh({ kind: "tripList" });
  return {};
}

export async function updateCurrency(formData: FormData): Promise<{ error?: string }> {
  const viewer = await requireUser();
  await ensureProfile(viewer.id);

  const homeCurrency = String(formData.get("homeCurrency") ?? "GBP") as Currency;
  if (!CURRENCIES.includes(homeCurrency)) {
    return { error: "Pick a currency Floc supports." };
  }

  await updateProfileFields(viewer.id, { homeCurrency });

  refresh({ kind: "profile" });
  return {};
}

export async function updateVibeTags(formData: FormData): Promise<{ error?: string }> {
  const viewer = await requireUser();
  await ensureProfile(viewer.id);

  const picked = parseVibeTags(formData.getAll("vibeTag").map(String));

  await updateProfileFields(viewer.id, { vibeTags: picked.length ? picked : null });

  refresh({ kind: "profile" });
  return {};
}

export async function updatePacking(formData: FormData): Promise<{ error?: string }> {
  const viewer = await requireUser();
  await ensureProfile(viewer.id);

  const packTier = parsePackTier(formData.get("packTier"));
  if (!packTier) return { error: "Pick a packing style." };

  await updateProfileFields(viewer.id, {
    packTier,
    packAutoGenerate: formData.get("packAutoGenerate") === "on",
  });

  refresh({ kind: "profile" });
  return {};
}

export async function setReduceMotion(reduceMotion: boolean): Promise<void> {
  const viewer = await requireUser();
  await ensureProfile(viewer.id);
  await updateProfileFields(viewer.id, { reduceMotion });
  refresh({ kind: "profile" });
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
  const countryCode = readCountryCode(code);
  if (!countryCode) return;

  if (next === "green" || next === "yellow") {
    await setManualMark(viewer.id, countryCode, next);
  } else if (await derivedStateFor(viewer.id, countryCode)) {
    await setManualMark(viewer.id, countryCode, "none");
  } else {
    await clearManualMark(viewer.id, countryCode);
  }

  refresh({ kind: "profile" });
}
