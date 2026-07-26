"use server";

/**
 * Mutations for /trips and /trips/archived (ticket 17).
 * Everything trip-scoped goes through requireTripAccess + assertAdmin —
 * never a hand-rolled membership check (see src/lib/access.ts).
 */
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { trip, tripMembership } from "@/db/schema";
import { assertAdmin, requireTripAccess, requireUser } from "@/lib/access";
import { ensureProfile } from "@/lib/profile";
import { touch } from "@/lib/unlocks";

/**
 * Ticket 01 step 1: the smallest thing that exists at creation is a name,
 * the creator as admin, and an empty idea board — nothing else. Dates are
 * optional and guessed at by nobody.
 */
export async function createTrip(formData: FormData): Promise<void> {
  const viewer = await requireUser("/trips");
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("A trip needs a name");

  const startDate = String(formData.get("startDate") ?? "").trim() || null;
  const endDate = String(formData.get("endDate") ?? "").trim() || null;

  await ensureProfile(viewer.id);

  const [created] = await db
    .insert(trip)
    .values({
      name,
      startDate,
      endDate,
      createdBy: viewer.id,
      // Never derived from the trip id — an unguessable share token (ticket 05).
      inviteToken: crypto.randomUUID(),
    })
    .returning({ id: trip.id });

  await db.insert(tripMembership).values({
    tripId: created.id,
    userId: viewer.id,
    role: "admin",
  });

  revalidatePath("/trips");
  redirect(`/trip/${created.id}/overview`);
}

/** Admin-only (ticket 01 step 7). Archived trips stay visible to every member. */
export async function archiveTrip(tripId: number): Promise<void> {
  const access = await requireTripAccess(tripId);
  assertAdmin(access);

  await db
    .update(trip)
    .set({ archivedAt: new Date(), ...touch() })
    .where(eq(trip.id, tripId));

  revalidatePath("/trips");
  revalidatePath("/trips/archived");
  revalidatePath(`/trip/${tripId}/overview`);
}

/**
 * Admin-only. There is no member-facing "request restore" flow in v1
 * (ticket 17) — a member who wants a trip back just asks an admin, which
 * /trips/archived surfaces by naming them.
 */
export async function restoreTrip(tripId: number): Promise<void> {
  const access = await requireTripAccess(tripId);
  assertAdmin(access);

  await db
    .update(trip)
    .set({ archivedAt: null, ...touch() })
    .where(eq(trip.id, tripId));

  revalidatePath("/trips");
  revalidatePath("/trips/archived");
  revalidatePath(`/trip/${tripId}/overview`);
}

/** Admin-only, any stage, no undo — soft-delete per ticket 04's convention. */
export async function deleteTrip(tripId: number): Promise<void> {
  const access = await requireTripAccess(tripId);
  assertAdmin(access);

  await db
    .update(trip)
    .set({ deletedAt: new Date(), ...touch() })
    .where(eq(trip.id, tripId));

  revalidatePath("/trips");
  revalidatePath("/trips/archived");
  redirect("/trips");
}
