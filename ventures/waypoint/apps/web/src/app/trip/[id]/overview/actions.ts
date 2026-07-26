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
import { assertAdmin, requireTripAccess } from "@/lib/access";
import { emails, sendEmail } from "@/lib/email";
import { touch } from "@/lib/unlocks";

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
  await db
    .update(tripMembership)
    .set({ deletedAt: new Date(), ...touch() })
    .where(
      and(
        eq(tripMembership.tripId, tripId),
        eq(tripMembership.userId, userId),
        isNull(tripMembership.deletedAt),
      ),
    );

  revalidatePath(`/trip/${tripId}/overview`);
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
