"use server";

/**
 * Overview mutations (ticket 13). The SQL and the revalidation sets are
 * `server/membership.ts`'s (ticket 108); this file is the Overview tab's
 * decisions about who may do what.
 * Admin-gated ones (kick, promote, delete)
 * call `assertAdmin`; `setTripDates` and `sendNudge` are open to any member —
 * ticket 01 step 7: admin's only extra powers are invite, kick, delete
 * (+ promote).
 */
import { redirect } from "next/navigation";

import { type NudgeTab } from "@/db/schema";
import { assertAdmin, requireTripAccess } from "@/server/access";
import { emails, sendEmail } from "@/server/email";
import { parseTagRows } from "@/lib/tags";
import {
  insertNudge,
  leaveTripAs,
  removeMembership,
  renameTrip as writeTripName,
  revalidateOverview,
  revalidateProfileTrips,
  revalidateTripHeader,
  revalidateTripLists,
  setMemberRoleAdmin,
  setTripArchived,
  setTripDateRange,
  setTripTagRows,
  softDeleteTrip,
} from "@/server/membership";

export async function sendNudge(formData: FormData) {
  const tripId = Number(formData.get("tripId"));
  const toUserId = String(formData.get("toUserId"));
  const tab = String(formData.get("tab")) as NudgeTab;
  const message = String(formData.get("message") ?? "").trim() || null;

  const access = await requireTripAccess(tripId);
  const recipient = access.members.find((m) => m.userId === toUserId);
  if (!recipient) throw new Error("Not a member of this trip");

  await insertNudge({
    tripId,
    fromUserId: access.viewer.id,
    toUserId,
    tab,
    message,
  });

  await sendEmail(
    emails.nudge({
      to: recipient.email,
      toUserId: recipient.userId,
      tripId,
      tripName: access.trip.name,
      fromName: access.viewer.name,
      tab,
      message,
    }),
  );

  revalidateOverview(tripId);
}

export async function kickMember(formData: FormData) {
  const tripId = Number(formData.get("tripId"));
  const userId = String(formData.get("userId"));

  const access = await requireTripAccess(tripId);
  assertAdmin(access);

  await removeMembership(tripId, userId);

  revalidateOverview(tripId);
  revalidateProfileTrips();
}

export async function promoteMember(formData: FormData) {
  const tripId = Number(formData.get("tripId"));
  const userId = String(formData.get("userId"));

  const access = await requireTripAccess(tripId);
  assertAdmin(access);

  await setMemberRoleAdmin(tripId, userId);

  revalidateOverview(tripId);
}

/**
 * Renaming is open to any member, like `setTripDates`. It is deliberately not
 * an admin power: the four (plus archive/restore) are fixed, and a trip called
 * "Trip" because whoever created it typed fast shouldn't need a promotion to
 * fix. Last-write-wins, like everything else — no locking.
 */
export async function renameTrip(formData: FormData) {
  const tripId = Number(formData.get("tripId"));
  const name = String(formData.get("name") ?? "").trim();

  if (!name) return { error: "A trip needs a name." };
  if (name.length > 120) return { error: "That name is too long." };

  await requireTripAccess(tripId);

  await writeTripName(tripId, name);

  // The name is in the trip header, which every tab renders — and on the cards.
  revalidateTripHeader(tripId);
  revalidateTripLists();
}

/**
 * Trip tags (ticket 71). Open to any member for the same reason renaming is:
 * a label the group puts on its own trip isn't one of admin's four powers.
 * `parseTagRows` owns normalisation and the caps, so this only decides where
 * the tags are edited, not what a tag is.
 *
 * Empty clears them: a trip with no tags stores `[]`, never a half-state.
 *
 * Colour rides along in the same save (ticket 86): the editor posts one
 * `tag`/`tone` pair per row, so renaming a tag carries its colour with
 * it and clearing the name is how the tag is deleted.
 */
export async function setTripTags(formData: FormData) {
  const tripId = Number(formData.get("tripId"));
  const names = formData.getAll("tag").map(String);
  const tones = formData.getAll("tone").map(String);
  const { tags, tagTones } = parseTagRows(
    names.map((name, i) => ({ name, tone: tones[i] ?? "" })),
  );

  await requireTripAccess(tripId);

  await setTripTagRows(tripId, tags, tagTones);

  revalidateOverview(tripId);
  revalidateTripLists();
}

export async function setTripDates(formData: FormData) {
  const tripId = Number(formData.get("tripId"));
  const startDate = String(formData.get("startDate") ?? "").trim() || null;
  const endDate = String(formData.get("endDate") ?? "").trim() || null;

  // Any member may set dates — no lifecycle lock (ticket 04).
  await requireTripAccess(tripId);

  await setTripDateRange(tripId, startDate, endDate);

  revalidateOverview(tripId);
}

export async function deleteTripFromOverview(formData: FormData) {
  const tripId = Number(formData.get("tripId"));

  const access = await requireTripAccess(tripId);
  assertAdmin(access);

  await softDeleteTrip(tripId);

  redirect("/trips");
}

/**
 * Leaving a trip (ticket 65). Open to every member including an admin: staying
 * in a trip you've dropped out of isn't a permission, and kicking yourself
 * isn't what the boot on the roster is for.
 *
 * Two consequences the caller has to warn about, both decided here rather than
 * asked about in a second dialog:
 *
 *  - **Succession.** If the leaver is the last admin and other members remain,
 *    admin passes automatically to whoever joined earliest. A picker was the
 *    alternative and it buys nothing: the leaver is on their way out, so making
 *    them nominate a successor is a question asked of the one person who no
 *    longer has a stake in the answer. Earliest-joined is arbitrary but stable
 *    and explicable, and any admin can promote someone else afterwards.
 *  - **The last one out archives the trip.** A trip with no members can't be
 *    reached by anybody, so leaving it merely un-listed would strand the rows.
 *    Archived is the honest state for it, and it is NOT a delete — nothing is
 *    soft-deleted here, so the trip is still there if a member is ever restored
 *    to it. Nobody in the app can reopen it, though, which is why the confirm
 *    copy says so out loud.
 *
 * Note this promotes without an admin acting, which is the one exception to
 * "role changes come from `promoteMember`" — CLAUDE.md rule 6 keeps the *powers*
 * at four; this is succession, not a fifth power.
 */
export async function leaveTrip(formData: FormData) {
  const tripId = Number(formData.get("tripId"));

  const access = await requireTripAccess(tripId);

  await leaveTripAs({
    tripId,
    userId: access.viewer.id,
    isAdmin: access.isAdmin,
    archivedAt: access.trip.archivedAt,
    others: access.members.filter((m) => m.userId !== access.viewer.id),
  });

  revalidateTripLists();
  revalidateProfileTrips();
  redirect("/trips");
}

/**
 * Archiving from Trip settings (ticket 66). `archiveTrip` has existed in
 * trips/actions.ts since ticket 17 and was never wired to anything — which is
 * half of why deleting felt like the only way to get a finished trip off the
 * list, and why it read as permanent. The reversible option now sits next to
 * the irreversible one, in the same place, so the choice is visible at the
 * moment it's made.
 */
export async function archiveTripFromOverview(formData: FormData) {
  const tripId = Number(formData.get("tripId"));

  const access = await requireTripAccess(tripId);
  assertAdmin(access);

  await setTripArchived(tripId, true);

  revalidateTripLists();
  redirect("/trips/archived");
}
