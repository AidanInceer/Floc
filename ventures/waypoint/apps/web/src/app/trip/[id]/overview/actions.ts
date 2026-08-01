"use server";

/**
 * Overview mutations (ticket 13). Admin-gated ones (kick, promote, delete)
 * call `assertAdmin`; `setTripDates` and `sendNudge` are open to any member —
 * ticket 01 step 7: admin's only extra powers are invite, kick, delete
 * (+ promote).
 */
import { and, eq, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { nudge, trip, tripMembership, type NudgeTab } from "@/db/schema";
import { assertAdmin, requireTripAccess } from "@/server/access";
import { emails, sendEmail } from "@/server/email";
import { parseTagRows } from "@/lib/tags";
import { touch } from "@/server/unlocks";

export async function sendNudge(formData: FormData) {
  const tripId = Number(formData.get("tripId"));
  const toUserId = String(formData.get("toUserId"));
  const tab = String(formData.get("tab")) as NudgeTab;
  const message = String(formData.get("message") ?? "").trim() || null;

  const access = await requireTripAccess(tripId);
  const recipient = access.members.find((m) => m.userId === toUserId);
  if (!recipient) throw new Error("Not a member of this trip");

  await db.insert(nudge).values({
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

  revalidatePath(`/trip/${tripId}/overview`);
}

export async function kickMember(formData: FormData) {
  const tripId = Number(formData.get("tripId"));
  const userId = String(formData.get("userId"));

  const access = await requireTripAccess(tripId);
  assertAdmin(access);

  // Soft-delete the membership row — kicking never touches their user row.
  // `map_prompt_at` parks one question on their travel map: this trip's
  // countries stop being derived now, do they want to keep them (ticket 95)?
  // Asked of *them*, later — an admin may not answer it on their behalf.
  await db
    .update(tripMembership)
    .set({ deletedAt: new Date(), mapPromptAt: new Date(), ...touch() })
    .where(
      and(
        eq(tripMembership.tripId, tripId),
        eq(tripMembership.userId, userId),
        isNull(tripMembership.deletedAt),
      ),
    );

  revalidatePath(`/trip/${tripId}/overview`);
  revalidatePath("/profile");
}

export async function promoteMember(formData: FormData) {
  const tripId = Number(formData.get("tripId"));
  const userId = String(formData.get("userId"));

  const access = await requireTripAccess(tripId);
  assertAdmin(access);

  await db
    .update(tripMembership)
    .set({ role: "admin", ...touch() })
    .where(
      and(
        eq(tripMembership.tripId, tripId),
        eq(tripMembership.userId, userId),
        isNull(tripMembership.deletedAt),
      ),
    );

  revalidatePath(`/trip/${tripId}/overview`);
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

  await db
    .update(trip)
    .set({ name, ...touch() })
    .where(eq(trip.id, tripId));

  // "layout" — the name is in the trip header, which every tab renders.
  revalidatePath(`/trip/${tripId}`, "layout");
  revalidatePath("/trips");
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

  await db
    .update(trip)
    .set({ tags, tagTones, ...touch() })
    .where(eq(trip.id, tripId));

  revalidatePath(`/trip/${tripId}/overview`);
  revalidatePath("/trips");
}

export async function setTripDates(formData: FormData) {
  const tripId = Number(formData.get("tripId"));
  const startDate = String(formData.get("startDate") ?? "").trim() || null;
  const endDate = String(formData.get("endDate") ?? "").trim() || null;

  // Any member may set dates — no lifecycle lock (ticket 04).
  await requireTripAccess(tripId);

  await db
    .update(trip)
    .set({ startDate, endDate, ...touch() })
    .where(eq(trip.id, tripId));

  revalidatePath(`/trip/${tripId}/overview`);
}

export async function deleteTripFromOverview(formData: FormData) {
  const tripId = Number(formData.get("tripId"));

  const access = await requireTripAccess(tripId);
  assertAdmin(access);

  // Soft-delete only — admin is the *only* role that can delete (ticket 01).
  await db
    .update(trip)
    .set({ deletedAt: new Date(), ...touch() })
    .where(eq(trip.id, tripId));

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
  const others = access.members.filter((m) => m.userId !== access.viewer.id);

  await db
    .update(tripMembership)
    // Same question as a kick leaves behind, asked the same way — on the
    // travel map rather than in a second dialog on the way out (ticket 95).
    .set({ deletedAt: new Date(), mapPromptAt: new Date(), ...touch() })
    .where(
      and(
        eq(tripMembership.tripId, tripId),
        eq(tripMembership.userId, access.viewer.id),
        isNull(tripMembership.deletedAt),
      ),
    );

  if (others.length === 0) {
    // Already archived stays at its original date — an unlock never regresses
    // and neither should this.
    if (!access.trip.archivedAt) {
      await db
        .update(trip)
        .set({ archivedAt: new Date(), ...touch() })
        .where(eq(trip.id, tripId));
    }
  } else if (access.isAdmin && !others.some((m) => m.role === "admin")) {
    const heir = others.reduce((earliest, m) =>
      m.joinedAt < earliest.joinedAt ? m : earliest,
    );
    await db
      .update(tripMembership)
      .set({ role: "admin", ...touch() })
      .where(
        and(
          eq(tripMembership.tripId, tripId),
          eq(tripMembership.userId, heir.userId),
          isNull(tripMembership.deletedAt),
        ),
      );
  }

  revalidatePath("/trips");
  revalidatePath("/trips/archived");
  revalidatePath("/profile");
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

  await db
    .update(trip)
    .set({ archivedAt: new Date(), ...touch() })
    .where(eq(trip.id, tripId));

  revalidatePath("/trips");
  revalidatePath("/trips/archived");
  redirect("/trips/archived");
}
