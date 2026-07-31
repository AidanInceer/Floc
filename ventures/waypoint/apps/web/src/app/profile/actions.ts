"use server";

/**
 * Profile edits (tickets 06/18, reshaped by 46). Everything writable here is a
 * *profile* field — who you are. The privacy flags that decide who sees them
 * live on /settings, because privacy is configuration, not profile.
 *
 * Email is not here at all any more: it's Better Auth's, it can't change from
 * this page, and a permanently-disabled field was the single thing making the
 * profile read as a form.
 */
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { CURRENCIES, userProfile } from "@/db/schema";
import type { Currency } from "@/db/schema";
import { requireUser } from "@/lib/access";
import { MAX_DIETARY_NOTES, parseDietFlags } from "@/lib/dietary";
import { ensureProfile } from "@/lib/profile";
import { parseVibeTags } from "@/lib/vibe-tags";

export async function updateIdentity(formData: FormData): Promise<{ error?: string }> {
  const viewer = await requireUser();
  await ensureProfile(viewer.id);

  const displayName = String(formData.get("displayName") ?? "").trim();
  const avatarUrl = String(formData.get("avatarUrl") ?? "").trim();
  const homeCurrency = String(formData.get("homeCurrency") ?? "GBP") as Currency;

  if (!CURRENCIES.includes(homeCurrency)) {
    return { error: "Pick a currency Waypoint supports." };
  }

  await db
    .update(userProfile)
    .set({
      displayName: displayName || null,
      avatarUrl: avatarUrl || null,
      homeCurrency,
      lastModifiedAt: new Date(),
    })
    .where(eq(userProfile.userId, viewer.id));

  revalidatePath("/profile");
  return {};
}

/**
 * The chip picker posts one `vibeTag` value per selected chip. `parseVibeTags`
 * re-checks every one against the seed list — the picker can only offer valid
 * tags, but a hand-crafted POST must not be able to invent one (ticket 46).
 */
export async function updateVibeTags(formData: FormData): Promise<{ error?: string }> {
  const viewer = await requireUser();
  await ensureProfile(viewer.id);

  const picked = parseVibeTags(formData.getAll("vibeTag").map(String));

  await db
    .update(userProfile)
    .set({
      vibeTags: picked.length ? picked : null,
      lastModifiedAt: new Date(),
    })
    .where(eq(userProfile.userId, viewer.id));

  revalidatePath("/profile");
  return {};
}

/**
 * Diet flags and the free-text allergies line. `shareDietary` is deliberately
 * saved here rather than with the other privacy flags on /settings: it is the
 * one switch that reads as part of the fact itself, and it covers the whole
 * record at once — you cannot publish half a dietary record (ticket 46).
 */
export async function updateDietary(formData: FormData): Promise<{ error?: string }> {
  const viewer = await requireUser();
  await ensureProfile(viewer.id);

  const flags = parseDietFlags(formData.getAll("dietFlag").map(String));
  const notes = String(formData.get("dietaryNotes") ?? "")
    .trim()
    .slice(0, MAX_DIETARY_NOTES);

  await db
    .update(userProfile)
    .set({
      dietFlags: flags.length ? flags : null,
      dietaryNotes: notes || null,
      shareDietary: formData.get("shareDietary") === "on",
      lastModifiedAt: new Date(),
    })
    .where(eq(userProfile.userId, viewer.id));

  revalidatePath("/profile");
  return {};
}
