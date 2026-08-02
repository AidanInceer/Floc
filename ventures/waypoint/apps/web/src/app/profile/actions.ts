"use server";

/**
 * Profile edits (tickets 06/18, reshaped by 46). Everything writable here is a
 * *profile* field — who you are. The privacy flags that decide who sees them
 * live on /settings, because privacy is configuration, not profile.
 *
 * Email is not here at all any more: it's Better Auth's, it can't change from
 * this page, and a permanently-disabled field was the single thing making the
 * profile read as a form.
 *
 * The writes are `server/profile.ts`'s and `server/travel-map.ts`'s
 * (ticket 108). What stays here is validation and what each form means.
 */
import { CURRENCIES } from "@/db/schema";
import type { Currency } from "@/db/schema";
import { requireUser } from "@/server/access";
import { readCountryCode } from "@/lib/countries";
import { MAX_DIETARY_NOTES, parseDietFlags } from "@/lib/dietary";
import { capText } from "@/lib/text";
import { clearMapPrompt, hasPendingMapPrompt } from "@/server/membership";
import {
  ensureProfile,
  revalidateProfile,
  updateProfileFields,
} from "@/server/profile";
import {
  clearManualMark,
  derivedStateFor,
  keepMarksFromTrip,
  setManualMark,
} from "@/server/travel-map";
import { parseVibeTags } from "@/lib/vibe-tags";

export async function updateIdentity(formData: FormData): Promise<{ error?: string }> {
  const viewer = await requireUser();
  await ensureProfile(viewer.id);

  const displayName = capText(formData.get("displayName"), "displayName");
  const avatarUrl = capText(formData.get("avatarUrl"), "avatarUrl");
  const homeCurrency = String(formData.get("homeCurrency") ?? "GBP") as Currency;

  if (!CURRENCIES.includes(homeCurrency)) {
    return { error: "Pick a currency Waypoint supports." };
  }

  await updateProfileFields(viewer.id, { displayName, avatarUrl, homeCurrency });

  revalidateProfile();
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

  await updateProfileFields(viewer.id, { vibeTags: picked.length ? picked : null });

  revalidateProfile();
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

  await updateProfileFields(viewer.id, {
    dietFlags: flags.length ? flags : null,
    dietaryNotes: notes || null,
    shareDietary: formData.get("shareDietary") === "on",
  });

  revalidateProfile();
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
    await setManualMark(viewer.id, countryCode, next);
  } else if (await derivedStateFor(viewer.id, countryCode)) {
    // What the trips would say with the hand mark gone — asked of the
    // derivation directly, since the merged view has the mark still in it.
    // Something is still claiming this country, so blank means "no, I didn't
    // go": a `none` row, not a deletion.
    await setManualMark(viewer.id, countryCode, "none");
  } else {
    await clearManualMark(viewer.id, countryCode);
  }

  revalidateProfile();
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

  if (!(await hasPendingMapPrompt(tripId, viewer.id))) return;

  if (keep) await keepMarksFromTrip(viewer.id, tripId);
  await clearMapPrompt(tripId, viewer.id);

  revalidateProfile();
}

/**
 * The two buttons on the map prompt (ticket 117, S11). They were inline
 * `"use server"` wrappers on the page, there only because `answerMapPrompt`
 * takes arguments rather than a FormData — which is a reason to put the
 * FormData-shaped entry point here, not to define a mutation in a page.
 */
export async function keepPromptCountries(formData: FormData): Promise<void> {
  await answerMapPrompt(Number(formData.get("tripId")), true);
}

export async function dropPromptCountries(formData: FormData): Promise<void> {
  await answerMapPrompt(Number(formData.get("tripId")), false);
}
