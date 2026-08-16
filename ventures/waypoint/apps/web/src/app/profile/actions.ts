"use server";

// Profile edits — who you are. Privacy flags for who sees them live on
// /settings instead. Email isn't here: it's Better Auth's and can't change
// from this page.
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

// `parseVibeTags` re-checks every value against the seed list — a
// hand-crafted POST must not be able to invent a tag.
export async function updateVibeTags(formData: FormData): Promise<{ error?: string }> {
  const viewer = await requireUser();
  await ensureProfile(viewer.id);

  const picked = parseVibeTags(formData.getAll("vibeTag").map(String));

  await updateProfileFields(viewer.id, { vibeTags: picked.length ? picked : null });

  revalidateProfile();
  return {};
}

// `shareDietary` is saved here, not with the other privacy flags on
// /settings — it reads as part of the fact itself and covers the whole
// record at once; you can't publish half a dietary record.
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

// The client sends the state it wants *shown* — blank, yellow or green.
// "Blank" means two different things: over a country nothing else claims,
// it's a deletion; over one a trip *is* claiming, it's a rejection (a `none`
// row saying "no, I didn't go" — without it the app keeps asserting
// something false). Green/yellow are always written even if a trip already
// agrees, so a hand mark is never demoted by a trip afterwards.
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
    // Something still claims this country, so blank means "no, I didn't go".
    await setManualMark(viewer.id, countryCode, "none");
  } else {
    await clearManualMark(viewer.id, countryCode);
  }

  revalidateProfile();
}

// Answers the question a trip leaves behind when you're no longer on it.
// Keeping converts its countries to hand marks (the only place that
// conversion happens); declining just clears the question, no `none` row.
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

// FormData-shaped wrappers for the two map-prompt buttons — `answerMapPrompt`
// takes plain arguments, not a FormData.
export async function keepPromptCountries(formData: FormData): Promise<void> {
  await answerMapPrompt(Number(formData.get("tripId")), true);
}

export async function dropPromptCountries(formData: FormData): Promise<void> {
  await answerMapPrompt(Number(formData.get("tripId")), false);
}
