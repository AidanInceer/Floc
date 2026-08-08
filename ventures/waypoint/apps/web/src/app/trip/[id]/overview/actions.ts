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
import { after } from "next/server";

import { NUDGE_TABS, type NudgeTab } from "@/db/schema";
import { assertAdmin, requireTripAccess } from "@/server/access";
import { emails, sendEmails } from "@/server/email";
import { parseTagRows } from "@/lib/tags";
import { capText, TEXT_CAPS } from "@/lib/text";
import { LIMITS } from "@/server/limits";
import {
  insertNudge,
  inviteToTrip,
  leaveTripAs,
  revalidateInvites,
  removeMembership,
  renameTrip as writeTripName,
  revalidateOverview,
  revalidateProfileTrips,
  revalidateTripHeader,
  revalidateTripLists,
  setMemberRoleAdmin,
  setTripTagRows,
} from "@/server/membership";

export async function sendNudge(formData: FormData) {
  const tripId = Number(formData.get("tripId"));
  const toUserId = String(formData.get("toUserId"));
  // Checked rather than cast: the value arrives from a form, and a nudge whose
  // tab isn't one of the five is a mail deep-linking to a page that 404s —
  // which is exactly what a stale "route" would have been (ticket 144).
  const posted = String(formData.get("tab"));
  const tab = (NUDGE_TABS as readonly string[]).includes(posted)
    ? (posted as NudgeTab)
    : NUDGE_TABS[0];
  const message = capText(formData.get("message"), "nudgeMessage");

  const access = await requireTripAccess(tripId);
  const recipient = access.members.find((m) => m.userId === toUserId);
  if (!recipient) throw new Error("Not a member of this trip");

  await insertNudge({
    tripId: access.trip.id,
    fromUserId: access.viewer.id,
    toUserId,
    tab,
    message,
  });

  // The nudge is recorded the moment it's stored; the mail rides out after the
  // response (ticket 111), so nudging never waits on the provider.
  after(() =>
    sendEmails([
      emails.nudge({
        to: recipient.email,
        toUserId: recipient.userId,
        tripId: access.trip.id,
        tripName: access.trip.name,
        fromName: access.viewer.name,
        tab,
        message,
      }),
    ]),
  );

  revalidateOverview(access.trip.id);
}

/**
 * Asking friends onto the trip by name (ticket 146).
 *
 * Admin-gated, because inviting is one of the four (rule 6) — the share link
 * is admin-only for the same reason, and this is the same power with a name on
 * it. Nobody is added: `inviteToTrip` opens a pending row per person, and the
 * roster only grows when they accept on their own /trips.
 *
 * No email. The invite is delivered in-app on the invitee's next load, which is
 * what ticket 146 asks for; push is explicitly out of scope, and the existing
 * `emails.invite` addresses a mailbox rather than an account.
 */
export async function inviteFriends(formData: FormData) {
  const tripId = Number(formData.get("tripId"));
  const friendIds = [
    ...new Set(
      formData
        .getAll("friendIds")
        .map(String)
        .filter((v) => v.length > 0 && v.length <= 64),
    ),
  ].slice(0, LIMITS.members);

  const access = await requireTripAccess(tripId);
  assertAdmin(access);

  if (friendIds.length === 0) return;

  await inviteToTrip({
    tripId: access.trip.id,
    fromUserId: access.viewer.id,
    toUserIds: friendIds,
  });

  revalidateOverview(access.trip.id);
  revalidateInvites();
}

export async function kickMember(formData: FormData) {
  const tripId = Number(formData.get("tripId"));
  const userId = String(formData.get("userId"));

  const access = await requireTripAccess(tripId);
  assertAdmin(access);

  await removeMembership(access.trip.id, userId);

  revalidateOverview(access.trip.id);
  revalidateProfileTrips();
}

export async function promoteMember(formData: FormData) {
  const tripId = Number(formData.get("tripId"));
  const userId = String(formData.get("userId"));

  const access = await requireTripAccess(tripId);
  assertAdmin(access);

  await setMemberRoleAdmin(access.trip.id, userId);

  revalidateOverview(access.trip.id);
}

/**
 * Renaming is open to any member. It is deliberately not
 * an admin power: the four (plus archive/restore) are fixed, and a trip called
 * "Trip" because whoever created it typed fast shouldn't need a promotion to
 * fix. Last-write-wins, like everything else — no locking.
 */
export async function renameTrip(formData: FormData) {
  const tripId = Number(formData.get("tripId"));
  const name = String(formData.get("name") ?? "").trim();

  if (!name) return { error: "A trip needs a name." };
  // Rejected rather than truncated: a name is short enough that silently
  // clipping it would be visibly wrong (ticket 113).
  if (name.length > TEXT_CAPS.tripName) return { error: "That name is too long." };

  const access = await requireTripAccess(tripId);

  await writeTripName(access.trip.id, name);

  // The name is in the trip header, which every tab renders — and on the cards.
  revalidateTripHeader(access.trip.id);
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

  const access = await requireTripAccess(tripId);

  await setTripTagRows(access.trip.id, tags, tagTones);

  revalidateOverview(access.trip.id);
  revalidateTripLists();
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
    tripId: access.trip.id,
    userId: access.viewer.id,
    isAdmin: access.isAdmin,
    archivedAt: access.trip.archivedAt,
    others: access.members.filter((m) => m.userId !== access.viewer.id),
  });

  revalidateTripLists();
  revalidateProfileTrips();
  redirect("/trips");
}

