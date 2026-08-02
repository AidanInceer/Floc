/**
 * The membership aggregate — the trip row and who is on it (ticket 108):
 * `trip`, `trip_membership`, `availability` and `nudge`.
 *
 * These are one aggregate rather than four because the interesting writes span
 * them. Leaving a trip soft-deletes a membership, may promote a successor, and
 * may archive the trip — three tables, one decision, and it must not be
 * possible to do two of the three. Creating a trip is a row plus its first
 * admin. Availability is here for the same reason the Dates tab exists: it is
 * the group's answer to "when can you come", which is a fact about members.
 *
 * The rules it owns:
 *
 * - **Soft-delete (rule 8).** Every membership write filters
 *   `isNull(deletedAt)` so a kicked member's dead row is never revived by a
 *   promote — except `joinByToken`, which revives it *deliberately* and says so.
 * - **`LIMITS.members`** on the roster read, which lives in `server/access.ts`
 *   because `requireTripAccess` loads it as part of the scope object.
 * - **Revalidation.** The three sets — the trip header (which is in the layout,
 *   so every tab), the trip lists, and the overview — are named functions here
 *   rather than the twenty-odd loose `revalidatePath` calls they replace.
 * - **Succession (rule 6).** `leaveTripAs` is the only place a role changes
 *   without an admin acting, and it is one function so the "last admin out
 *   promotes the earliest joiner, last member out archives" pair can't come
 *   apart.
 */
import "server-only";

import { and, eq, isNotNull, isNull, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { availability, nudge, trip, tripMembership } from "@/db/schema";
import type { NudgeTab } from "@/db/schema";
import type { TagTone } from "@/lib/tags";
import { bounded, LIMITS } from "@/server/limits";
import { touch } from "@/server/unlocks";

/** The trip name/tags live in the header, which every tab renders. */
export function revalidateTripHeader(tripId: number): void {
  revalidatePath(`/trip/${tripId}`, "layout");
}

export function revalidateOverview(tripId: number): void {
  revalidatePath(`/trip/${tripId}/overview`);
}

/** Both trip lists — archiving moves a trip from one to the other. */
export function revalidateTripLists(): void {
  revalidatePath("/trips");
  revalidatePath("/trips/archived");
}

/** The profile page lists the trips someone is on, so a roster change touches it. */
export function revalidateProfileTrips(): void {
  revalidatePath("/profile");
}

/* ---------------------------------------------------------------- the trip */

/**
 * Creates the trip and its first membership. Ticket 01 step 1: the smallest
 * thing that exists at creation is a name, the creator as admin, and an empty
 * idea board — nothing else.
 */
export async function createTripWithAdmin(input: {
  name: string;
  startDate: string | null;
  endDate: string | null;
  createdBy: string;
}): Promise<number> {
  const [created] = await db
    .insert(trip)
    .values({
      name: input.name,
      startDate: input.startDate,
      endDate: input.endDate,
      createdBy: input.createdBy,
      // Never derived from the trip id — an unguessable share token (ticket 05).
      inviteToken: crypto.randomUUID(),
    })
    .returning({ id: trip.id });

  await db.insert(tripMembership).values({
    tripId: created.id,
    userId: input.createdBy,
    role: "admin",
  });

  return created.id;
}

export async function renameTrip(tripId: number, name: string): Promise<void> {
  await db.update(trip).set({ name, ...touch() }).where(eq(trip.id, tripId));
}

export async function setTripTagRows(
  tripId: number,
  tags: string[],
  tagTones: Record<string, TagTone>,
): Promise<void> {
  await db.update(trip).set({ tags, tagTones, ...touch() }).where(eq(trip.id, tripId));
}

/** Rule 9: both nullable, and clearing them back to undated is a normal move. */
export async function setTripDateRange(
  tripId: number,
  startDate: string | null,
  endDate: string | null,
): Promise<void> {
  await db
    .update(trip)
    .set({ startDate, endDate, ...touch() })
    .where(eq(trip.id, tripId));
}

export async function setTripArchived(
  tripId: number,
  archived: boolean,
): Promise<void> {
  await db
    .update(trip)
    .set({ archivedAt: archived ? new Date() : null, ...touch() })
    .where(eq(trip.id, tripId));
}

/** Soft-delete only — admin is the *only* role that can delete (ticket 01). */
export async function softDeleteTrip(tripId: number): Promise<void> {
  await db
    .update(trip)
    .set({ deletedAt: new Date(), ...touch() })
    .where(eq(trip.id, tripId));
}

/* ---------------------------------------------------------- the invite link */

export async function findTripByInviteToken(
  token: string,
): Promise<{ id: number } | undefined> {
  return db
    .select({ id: trip.id })
    .from(trip)
    .where(and(eq(trip.inviteToken, token), isNull(trip.deletedAt)))
    .get();
}

/**
 * Joins by link. The composite key means a previously kicked member already has
 * a row, just soft-deleted — so this must **revive** it rather than no-op, or a
 * kick would permanently bar someone the group has since re-invited. This is
 * the one membership write that deliberately reaches past `deletedAt`.
 */
export async function joinByToken(tripId: number, userId: string): Promise<void> {
  await db
    .insert(tripMembership)
    .values({ tripId, userId, role: "member" })
    .onConflictDoUpdate({
      target: [tripMembership.tripId, tripMembership.userId],
      // `map_prompt_at` clears with the rejoin: rejoining answers the "keep
      // this trip's countries?" question by making it moot (ticket 95).
      set: { deletedAt: null, mapPromptAt: null, lastModifiedAt: new Date() },
    });
}

/* ------------------------------------------------------------- the roster */

/** Matches one live membership row. Every roster write goes through this. */
function liveMembership(tripId: number, userId: string) {
  return and(
    eq(tripMembership.tripId, tripId),
    eq(tripMembership.userId, userId),
    isNull(tripMembership.deletedAt),
  );
}

/**
 * Removes someone from the roster — a kick, or their own exit.
 *
 * Never touches their user row. `map_prompt_at` parks one question on their
 * travel map: this trip's countries stop being derived now, do they want to
 * keep them (ticket 95)? Asked of *them*, later — nobody may answer it on
 * their behalf, which is why leaving and being kicked leave the same mark.
 */
export async function removeMembership(
  tripId: number,
  userId: string,
): Promise<void> {
  await db
    .update(tripMembership)
    .set({ deletedAt: new Date(), mapPromptAt: new Date(), ...touch() })
    .where(liveMembership(tripId, userId));
}

export async function setMemberRoleAdmin(
  tripId: number,
  userId: string,
): Promise<void> {
  await db
    .update(tripMembership)
    .set({ role: "admin", ...touch() })
    .where(liveMembership(tripId, userId));
}

/**
 * Leaving (ticket 65), with both consequences applied together so they cannot
 * come apart:
 *
 *  - **Succession.** If the leaver is the last admin and others remain, admin
 *    passes to whoever joined earliest. Arbitrary but stable and explicable,
 *    and any admin can promote someone else afterwards. Rule 6 keeps the
 *    *powers* at four; this is succession, not a fifth power.
 *  - **The last one out archives the trip.** A trip with no members can't be
 *    reached by anybody, so leaving it merely un-listed would strand the rows.
 *    It is NOT a delete — nothing is soft-deleted here, so the trip is still
 *    there if a member is ever restored to it. Already-archived keeps its
 *    original date: an archive, like an unlock, never regresses.
 */
export async function leaveTripAs(args: {
  tripId: number;
  userId: string;
  isAdmin: boolean;
  archivedAt: Date | null;
  others: { userId: string; role: string; joinedAt: Date }[];
}): Promise<void> {
  const { tripId, userId, isAdmin, archivedAt, others } = args;

  await removeMembership(tripId, userId);

  if (others.length === 0) {
    if (!archivedAt) await setTripArchived(tripId, true);
    return;
  }

  if (isAdmin && !others.some((m) => m.role === "admin")) {
    const heir = others.reduce((earliest, m) =>
      m.joinedAt < earliest.joinedAt ? m : earliest,
    );
    await setMemberRoleAdmin(tripId, heir.userId);
  }
}

/* -------------------------------------------------------------- the nudge */

export async function insertNudge(args: {
  tripId: number;
  fromUserId: string;
  toUserId: string;
  tab: NudgeTab;
  message: string | null;
}): Promise<void> {
  await db.insert(nudge).values(args);
}

/* -------------------------------------------------------- the availability */

/**
 * Marks one person free (or not) on a batch of dates in one statement.
 *
 * Unmarking writes `available: false` rather than soft-deleting the row: the
 * unique index is on (trip, user, date) and ignores `deleted_at`, so a
 * soft-deleted row would block the person from ever marking that day again.
 * The tally treats `false` and "no row" the same, so nothing downstream cares.
 */
export async function setAvailability(
  tripId: number,
  userId: string,
  dates: string[],
  isAvailable: boolean,
): Promise<void> {
  if (dates.length === 0) return;
  await db
    .insert(availability)
    .values(dates.map((date) => ({ tripId, userId, date, available: isAvailable })))
    .onConflictDoUpdate({
      target: [availability.tripId, availability.userId, availability.date],
      set: { available: isAvailable, deletedAt: null, ...touch() },
    });
}

/** Drops one person's own marks — never a way to wipe what the group said. */
export async function clearAvailabilityFor(
  tripId: number,
  userId: string,
): Promise<void> {
  await db
    .update(availability)
    .set({ available: false, ...touch() })
    .where(
      and(
        eq(availability.tripId, tripId),
        eq(availability.userId, userId),
        isNull(availability.deletedAt),
      ),
    );
}

/* ------------------------------------------------------- the map prompt */

/** Whether this trip has left its "keep these countries?" question unanswered. */
export async function hasPendingMapPrompt(
  tripId: number,
  userId: string,
): Promise<boolean> {
  const row = await db
    .select({ tripId: tripMembership.tripId })
    .from(tripMembership)
    .where(
      and(
        eq(tripMembership.tripId, tripId),
        eq(tripMembership.userId, userId),
        isNotNull(tripMembership.mapPromptAt),
      ),
    )
    .get();
  return row !== undefined;
}

/**
 * Clears the question. Deliberately not filtered on `deletedAt`: the row this
 * targets belongs to somebody who has *left* the trip, so it is soft-deleted by
 * definition — which is exactly why `removeMembership` set the flag.
 */
export async function clearMapPrompt(
  tripId: number,
  userId: string,
): Promise<void> {
  await db
    .update(tripMembership)
    .set({ mapPromptAt: null, lastModifiedAt: new Date() })
    .where(
      and(eq(tripMembership.tripId, tripId), eq(tripMembership.userId, userId)),
    );
}

/* ------------------------------------------------- leaving every trip at once */

/**
 * The roster half of deleting an account (ticket 06): hand each trip over
 * where it can be handed over, then drop every membership.
 *
 * Same succession rule as `leaveTripAs`, and here for the same reason — the
 * promote and the departure must not come apart. The difference is only that
 * this walks every trip at once and does *not* archive an emptied one: the
 * account is going, but the trip's other rows (ideas, expenses, notes) stay
 * attributed to a "deleted user" placeholder, and archiving on their behalf
 * would be a decision nobody made.
 *
 * A trip whose only member was the leaver is left with no admin. That is an
 * accepted v1 edge case, written down here rather than papered over.
 */
export async function handOverAndLeaveAllTrips(userId: string): Promise<void> {
  const mine = await db
    .select({ tripId: tripMembership.tripId, role: tripMembership.role })
    .from(tripMembership)
    .where(and(eq(tripMembership.userId, userId), isNull(tripMembership.deletedAt)))
    .limit(LIMITS.tripsPerUser)
    .all();

  for (const m of bounded(mine, "tripsPerUser", `user's trips`)) {
    if (m.role !== "admin") continue;

    const otherAdmin = await db
      .select({ userId: tripMembership.userId })
      .from(tripMembership)
      .where(
        and(
          eq(tripMembership.tripId, m.tripId),
          eq(tripMembership.role, "admin"),
          ne(tripMembership.userId, userId),
          isNull(tripMembership.deletedAt),
        ),
      )
      .get();
    if (otherAdmin) continue; // not the sole admin — nothing to promote

    const earliestOther = await db
      .select({ userId: tripMembership.userId })
      .from(tripMembership)
      .where(
        and(
          eq(tripMembership.tripId, m.tripId),
          ne(tripMembership.userId, userId),
          isNull(tripMembership.deletedAt),
        ),
      )
      .orderBy(tripMembership.createdAt)
      .get();

    if (earliestOther) await setMemberRoleAdmin(m.tripId, earliestOther.userId);
  }

  await db
    .update(tripMembership)
    .set({ deletedAt: new Date(), lastModifiedAt: new Date() })
    .where(eq(tripMembership.userId, userId));
}
