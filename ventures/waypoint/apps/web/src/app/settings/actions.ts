"use server";

/**
 * Settings mutations (ticket 07): the four notification booleans, and account
 * deletion (ticket 06). No theme action — Waypoint is light-only.
 */
import { and, eq, isNull, ne } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { tripMembership, userProfile } from "@/db/schema";
import { requireUser } from "@/lib/access";
import { auth } from "@/lib/auth";
import { ensureProfile } from "@/lib/profile";

export async function updateNotifications(formData: FormData): Promise<void> {
  const viewer = await requireUser();
  await ensureProfile(viewer.id);
  await db
    .update(userProfile)
    .set({
      notifyInvites: formData.get("notifyInvites") === "on",
      notifyVotes: formData.get("notifyVotes") === "on",
      notifyMoney: formData.get("notifyMoney") === "on",
      notifyNudges: formData.get("notifyNudges") === "on",
      lastModifiedAt: new Date(),
    })
    .where(eq(userProfile.userId, viewer.id));
}

/**
 * Delete account (ticket 06). Order matters:
 *  1. Auto-promote the earliest-joined remaining member of any trip where
 *     the viewer is the *sole* admin, so the trip isn't left admin-less
 *     when it doesn't have to be.
 *  2. Soft-delete the viewer's own trip memberships.
 *  3. Call Better Auth's delete, which cascades the `user`/`session`/
 *     `account` rows.
 *
 * Deliberately left untouched: ideas, notes, votes, day_events (stay
 * attributed to the "deleted user" placeholder — see components/
 * deleted-user.tsx) and expense_split rows (stay, frozen, a deleted user's
 * balance still shows as owed by "deleted user" and is settled manually).
 * Nothing here rewrites `created_by`/`paid_by` — the placeholder is a
 * *display* choice (falling back when the joined user row is gone), not a
 * data rewrite.
 */
export async function deleteAccount(): Promise<void> {
  const viewer = await requireUser();

  const myMemberships = await db
    .select({ tripId: tripMembership.tripId, role: tripMembership.role })
    .from(tripMembership)
    .where(and(eq(tripMembership.userId, viewer.id), isNull(tripMembership.deletedAt)))
    .all();

  const myAdminTripIds = myMemberships.filter((m) => m.role === "admin").map((m) => m.tripId);

  for (const tripId of myAdminTripIds) {
    const otherAdmins = await db
      .select({ userId: tripMembership.userId })
      .from(tripMembership)
      .where(
        and(
          eq(tripMembership.tripId, tripId),
          eq(tripMembership.role, "admin"),
          ne(tripMembership.userId, viewer.id),
          isNull(tripMembership.deletedAt),
        ),
      )
      .get();

    if (otherAdmins) continue; // not the sole admin — nothing to promote

    const earliestOther = await db
      .select({ userId: tripMembership.userId })
      .from(tripMembership)
      .where(
        and(
          eq(tripMembership.tripId, tripId),
          ne(tripMembership.userId, viewer.id),
          isNull(tripMembership.deletedAt),
        ),
      )
      .orderBy(tripMembership.createdAt)
      .get();

    if (earliestOther) {
      await db
        .update(tripMembership)
        .set({ role: "admin", lastModifiedAt: new Date() })
        .where(
          and(
            eq(tripMembership.tripId, tripId),
            eq(tripMembership.userId, earliestOther.userId),
          ),
        );
    }
    // Else: no other members — the trip is left with no admin, an accepted
    // v1 edge case (ticket 06).
  }

  await db
    .update(tripMembership)
    .set({ deletedAt: new Date(), lastModifiedAt: new Date() })
    .where(eq(tripMembership.userId, viewer.id));

  // Better Auth's own delete — cascades user/session/account rows. Soft in
  // effect for everything we own (above); this is the one hard delete, on
  // Better Auth's tables only.
  await auth.api.deleteUser({ headers: await headers(), body: {} });

  redirect("/login");
}
