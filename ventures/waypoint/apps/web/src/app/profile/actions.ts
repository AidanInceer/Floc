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
import { and, eq, isNotNull, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { CURRENCIES, tripMembership, userCountryMark, userProfile } from "@/db/schema";
import type { Currency } from "@/db/schema";
import { requireUser } from "@/server/access";
import { readCountryCode } from "@/lib/countries";
import { MAX_DIETARY_NOTES, parseDietFlags } from "@/lib/dietary";
import { ensureProfile } from "@/server/profile";
import { countriesForTrips } from "@/server/travel-map";
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

/* -------------------------------------------------------------------------- */
/* The travel map (ticket 95)                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Paint one country. The client sends the state it wants *shown* — blank,
 * yellow or green — and the translation into a stored row happens here,
 * because "blank" means two different things:
 *
 *  - over a country nothing else is claiming, it's a deletion: you took the
 *    mark back and the trips are free to speak again.
 *  - over a country one of your trips *is* claiming, it's a rejection. A `none`
 *    row is how you say "no, I didn't go" — the trip was cancelled after its
 *    dates passed, you dropped out, you never went. Without it the app keeps
 *    asserting something false about you on a page other people read.
 *
 * Green and yellow are always written, even where a trip already says the same
 * thing: that is what makes a mark permanent, and a hand mark is never demoted
 * by a trip afterwards.
 */
export async function setCountryMark(
  code: string,
  next: "green" | "yellow" | "blank",
): Promise<void> {
  const viewer = await requireUser();
  const countryCode = readCountryCode(code);
  if (!countryCode) return;

  if (next === "green" || next === "yellow") {
    await db
      .insert(userCountryMark)
      .values({ userId: viewer.id, countryCode, state: next })
      .onConflictDoUpdate({
        target: [userCountryMark.userId, userCountryMark.countryCode],
        set: { state: next, lastModifiedAt: new Date() },
      });
  } else {
    // What the trips would say with the hand mark gone — asked of the
    // derivation directly, since the merged view has the mark still in it.
    const claimed = await derivedStateFor(viewer.id, countryCode);

    if (claimed) {
      await db
        .insert(userCountryMark)
        .values({ userId: viewer.id, countryCode, state: "none" })
        .onConflictDoUpdate({
          target: [userCountryMark.userId, userCountryMark.countryCode],
          set: { state: "none", lastModifiedAt: new Date() },
        });
    } else {
      await db
        .delete(userCountryMark)
        .where(
          and(
            eq(userCountryMark.userId, viewer.id),
            eq(userCountryMark.countryCode, countryCode),
          ),
        );
    }
  }

  revalidatePath("/profile");
}

/** Whether any of the viewer's current trips puts this country on their map. */
async function derivedStateFor(userId: string, countryCode: string) {
  const memberships = await db
    .select({ tripId: tripMembership.tripId })
    .from(tripMembership)
    .where(and(eq(tripMembership.userId, userId), isNull(tripMembership.deletedAt)))
    .all();
  const derived = await countriesForTrips(memberships.map((m) => m.tripId));
  return derived[countryCode];
}

/**
 * Answer the question a trip leaves behind when you're no longer on it
 * (ticket 95). Its countries are about to stop being derived — keeping them
 * converts them to hand marks, which is the only place any conversion happens.
 *
 * Declining is not a `none` row: nothing was claiming those countries any more,
 * so there is nothing to reject. It just clears the question.
 */
export async function answerMapPrompt(
  tripId: number,
  keep: boolean,
): Promise<void> {
  const viewer = await requireUser();

  const pending = await db
    .select({ tripId: tripMembership.tripId })
    .from(tripMembership)
    .where(
      and(
        eq(tripMembership.tripId, tripId),
        eq(tripMembership.userId, viewer.id),
        isNotNull(tripMembership.mapPromptAt),
      ),
    )
    .get();
  if (!pending) return;

  if (keep) {
    const countries = await countriesForTrips([tripId]);
    for (const [countryCode, state] of Object.entries(countries)) {
      // Never overwrite something already said by hand — including a `none`,
      // which is a decision about that country and not a gap to fill.
      await db
        .insert(userCountryMark)
        .values({ userId: viewer.id, countryCode, state })
        .onConflictDoNothing();
    }
  }

  await db
    .update(tripMembership)
    .set({ mapPromptAt: null, lastModifiedAt: new Date() })
    .where(
      and(eq(tripMembership.tripId, tripId), eq(tripMembership.userId, viewer.id)),
    );

  revalidatePath("/profile");
}
