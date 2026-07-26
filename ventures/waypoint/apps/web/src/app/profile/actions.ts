"use server";

/**
 * Identity edits (ticket 06/18). Only our own copies on `user_profile` are
 * writable here — email is Better Auth's and stays read-only.
 */
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { CURRENCIES, account, userProfile } from "@/db/schema";
import type { Currency } from "@/db/schema";
import { requireUser } from "@/lib/access";
import { ensureProfile } from "@/lib/profile";

export async function updateProfile(formData: FormData): Promise<{ error?: string }> {
  const viewer = await requireUser();
  await ensureProfile(viewer.id);

  const displayName = String(formData.get("displayName") ?? "").trim();
  const avatarUrl = String(formData.get("avatarUrl") ?? "").trim();
  const homeCurrency = String(formData.get("homeCurrency") ?? "GBP") as Currency;
  const vibeRaw = String(formData.get("vibePreferences") ?? "");

  if (!CURRENCIES.includes(homeCurrency)) {
    return { error: "Pick a currency Waypoint supports." };
  }

  // One-per-line or comma-separated free text → JSON string[] (ticket 04:
  // vibe_preferences is deliberately unstructured, not a tag taxonomy).
  const vibePreferences = vibeRaw
    .split(/[\n,]/)
    .map((v) => v.trim())
    .filter(Boolean);

  await db
    .update(userProfile)
    .set({
      displayName: displayName || null,
      avatarUrl: avatarUrl || null,
      homeCurrency,
      vibePreferences: vibePreferences.length ? vibePreferences : null,
      lastModifiedAt: new Date(),
    })
    .where(eq(userProfile.userId, viewer.id));

  revalidatePath("/profile");
  return {};
}

/**
 * Unlink a connected sign-in method. Refuses to remove your last remaining
 * credential (ticket 06) — otherwise the account would have no way back in.
 */
export async function unlinkAccount(formData: FormData): Promise<{ error?: string }> {
  const viewer = await requireUser();
  const accountId = String(formData.get("accountId") ?? "");

  const linked = await db
    .select()
    .from(account)
    .where(eq(account.userId, viewer.id))
    .all();

  if (linked.length <= 1) {
    return { error: "You can't unlink your last sign-in method." };
  }

  const target = linked.find((a) => a.id === accountId);
  if (!target) return { error: "That sign-in method isn't linked." };

  await db.delete(account).where(eq(account.id, accountId));

  revalidatePath("/profile");
  return {};
}
