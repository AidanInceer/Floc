/**
 * `trip` + `trip_membership` + `availability` + `nudge` as one aggregate
 * (ticket 108) — leaving spans three tables and must not be split.
 * Soft-delete filtered everywhere except `joinByToken`, which revives deliberately.
 */
import "server-only";

import { and, count, eq, inArray, isNotNull, isNull, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import {
  availability,
  nudge,
  trip,
  tripInvite,
  tripMembership,
  user,
  userProfile,
} from "@/db/schema";
import type { NudgeTab, TripRole } from "@/db/schema";
import { bounded, LIMITS } from "@/server/limits";
import { touch } from "@/server/audit";

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

export type TripListRow = {
  id: number;
  name: string;
  startDate: string | null;
  endDate: string | null;
  tags: string[] | null;
  colorKey: string | null;
  role: TripRole;
};

/** `archived` is a param so /trips and /trips/archived share one query (ticket 118). */
export async function listTripsFor(
  userId: string,
  { archived }: { archived: boolean },
): Promise<TripListRow[]> {
  const rows = await db
    .select({
      id: trip.id,
      name: trip.name,
      startDate: trip.startDate,
      endDate: trip.endDate,
      tags: trip.tags,
      colorKey: trip.colorKey,
      role: tripMembership.role,
    })
    .from(tripMembership)
    .innerJoin(trip, eq(trip.id, tripMembership.tripId))
    .where(
      and(
        eq(tripMembership.userId, userId),
        isNull(tripMembership.deletedAt),
        isNull(trip.deletedAt),
        archived ? isNotNull(trip.archivedAt) : isNull(trip.archivedAt),
      ),
    )
    .limit(LIMITS.tripsPerUser)
    .all();
  return bounded(rows, "tripsPerUser", `user ${userId}`);
}

/** Roster count — the one fact the invite teaser may show. */
export async function countMembers(tripId: number): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(tripMembership)
    .where(
      and(eq(tripMembership.tripId, tripId), isNull(tripMembership.deletedAt)),
    );
  return row?.value ?? 0;
}

/** Smallest thing that exists at creation (ticket 01). */
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
      inviteToken: crypto.randomUUID(), // unguessable, never derived from id (ticket 05)
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

export async function setTripTags(
  tripId: number,
  tags: string[],
): Promise<void> {
  await db.update(trip).set({ tags, ...touch() }).where(and(eq(trip.id, tripId), isNull(trip.deletedAt)));
}

/** Chosen pastel (ticket 213); null clears it back to the id-rotation default. */
export async function setTripColor(
  tripId: number,
  colorKey: string | null,
): Promise<void> {
  await db.update(trip).set({ colorKey, ...touch() }).where(eq(trip.id, tripId));
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

/** Pre-auth teaser fields only (ticket 118) — no roster/money/notes; host name only, not email/id (ticket 147). */
export type InviteTrip = {
  id: number;
  name: string;
  startDate: string | null;
  endDate: string | null;
  hostName: string | null;
};

export async function findTripByInviteToken(
  token: string,
): Promise<InviteTrip | undefined> {
  const row = await db
    .select({
      id: trip.id,
      name: trip.name,
      startDate: trip.startDate,
      endDate: trip.endDate,
      hostName: user.name,
      hostDisplayName: userProfile.displayName,
    })
    .from(trip)
    .leftJoin(user, eq(user.id, trip.createdBy))
    .leftJoin(userProfile, eq(userProfile.userId, trip.createdBy))
    .where(and(eq(trip.inviteToken, token), isNull(trip.deletedAt)))
    .get();

  if (!row) return undefined;
  return {
    id: row.id,
    name: row.name,
    startDate: row.startDate,
    endDate: row.endDate,
    hostName: row.hostDisplayName ?? row.hostName ?? null,
  };
}

/** The teaser's "you're already in" check. */
export async function isLiveMember(tripId: number, userId: string): Promise<boolean> {
  const row = await db
    .select({ userId: tripMembership.userId })
    .from(tripMembership)
    .where(liveMembership(tripId, userId))
    .get();
  return !!row;
}

/** Must revive a soft-deleted row rather than no-op, or a kick would permanently bar a re-invited member — the one write that deliberately reaches past `deletedAt`. */
export async function joinByToken(tripId: number, userId: string): Promise<void> {
  await db
    .insert(tripMembership)
    .values({ tripId, userId, role: "member" })
    .onConflictDoUpdate({
      target: [tripMembership.tripId, tripMembership.userId],
      // mapPromptAt clears: rejoining moots the "keep these countries?" question (ticket 95)
      set: { deletedAt: null, mapPromptAt: null, lastModifiedAt: new Date() },
    });
}

/* ------------------------------------------------------- the named invite */
/*
 * Other half of ticket 146 — a named ask, not the anonymous link above.
 * Rules owned here: an invite is not a membership (only accept writes
 * trip_membership, via joinByToken's upsert); upsert never insert, since
 * `trip_invite_pair_idx` ignores deleted_at; `inviteToTrip` re-filters the
 * roster because the form is reachable without its page (ticket 113).
 */

/** One open invite, as the invitee's own /trips banner needs to render it. */
export type PendingInvite = {
  tripId: number;
  tripName: string;
  startDate: string | null;
  endDate: string | null;
  fromUserId: string;
  fromName: string;
  fromAvatarUrl: string | null;
  invitedAt: Date;
};

/** Already-on-roster ids are dropped, not rejected — a normal mistake, not worth failing the others over. */
export async function inviteToTrip(args: {
  tripId: number;
  fromUserId: string;
  toUserIds: string[];
}): Promise<number> {
  const { tripId, fromUserId } = args;

  const wanted = [...new Set(args.toUserIds)].filter((id) => id !== fromUserId);
  if (wanted.length === 0) return 0;

  const alreadyIn = await db
    .select({ userId: tripMembership.userId })
    .from(tripMembership)
    .where(
      and(
        eq(tripMembership.tripId, tripId),
        inArray(tripMembership.userId, wanted),
        isNull(tripMembership.deletedAt),
      ),
    )
    .all();

  const members = new Set(alreadyIn.map((m) => m.userId));
  const toInvite = wanted.filter((id) => !members.has(id));
  if (toInvite.length === 0) return 0;

  await db
    .insert(tripInvite)
    .values(
      toInvite.map((toUserId) => ({
        tripId,
        fromUserId,
        toUserId,
        status: "pending" as const,
      })),
    )
    .onConflictDoUpdate({
      target: [tripInvite.tripId, tripInvite.toUserId],
      set: {
        fromUserId,
        status: "pending",
        deletedAt: null,
        lastModifiedAt: new Date(),
      },
    });

  return toInvite.length;
}

/** Archived/soft-deleted trips filtered out — no deciding on an invite to a trip nobody can open (ticket 146). */
export async function listPendingInvitesFor(
  userId: string,
): Promise<PendingInvite[]> {
  const rows = await db
    .select({
      tripId: trip.id,
      tripName: trip.name,
      startDate: trip.startDate,
      endDate: trip.endDate,
      fromUserId: tripInvite.fromUserId,
      invitedAt: tripInvite.createdAt,
      fromName: user.name,
      fromImage: user.image,
      fromDisplayName: userProfile.displayName,
      fromAvatarUrl: userProfile.avatarUrl,
    })
    .from(tripInvite)
    .innerJoin(trip, eq(trip.id, tripInvite.tripId))
    .innerJoin(user, eq(user.id, tripInvite.fromUserId))
    .leftJoin(userProfile, eq(userProfile.userId, tripInvite.fromUserId))
    .where(
      and(
        eq(tripInvite.toUserId, userId),
        eq(tripInvite.status, "pending"),
        isNull(tripInvite.deletedAt),
        isNull(trip.deletedAt),
        isNull(trip.archivedAt),
      ),
    )
    .limit(LIMITS.invites)
    .all();

  return bounded(rows, "invites", `invites for ${userId}`).map((r) => ({
    tripId: r.tripId,
    tripName: r.tripName,
    startDate: r.startDate,
    endDate: r.endDate,
    fromUserId: r.fromUserId,
    fromName: r.fromDisplayName ?? r.fromName,
    fromAvatarUrl: r.fromAvatarUrl ?? r.fromImage ?? null,
    invitedAt: r.invitedAt,
  }));
}

/** Keeps the friend picker from offering the same person twice. */
export type PendingInvitee = {
  userId: string;
  name: string;
  avatarUrl: string | null;
};

export async function listPendingInvitees(
  tripId: number,
): Promise<PendingInvitee[]> {
  const rows = await db
    .select({
      userId: tripInvite.toUserId,
      name: user.name,
      image: user.image,
      displayName: userProfile.displayName,
      avatarUrl: userProfile.avatarUrl,
    })
    .from(tripInvite)
    .innerJoin(user, eq(user.id, tripInvite.toUserId))
    .leftJoin(userProfile, eq(userProfile.userId, tripInvite.toUserId))
    .where(
      and(
        eq(tripInvite.tripId, tripId),
        eq(tripInvite.status, "pending"),
        isNull(tripInvite.deletedAt),
      ),
    )
    .limit(LIMITS.invites)
    .all();

  return bounded(rows, "invites", `trip ${tripId}`).map((r) => ({
    userId: r.userId,
    name: r.displayName ?? r.name,
    avatarUrl: r.avatarUrl ?? r.image ?? null,
  }));
}

/** Own count query, not `listPendingInvitesFor(...).length` — root layout runs this every page. */
export async function countPendingInvitesFor(userId: string): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(tripInvite)
    .innerJoin(trip, eq(trip.id, tripInvite.tripId))
    .where(
      and(
        eq(tripInvite.toUserId, userId),
        eq(tripInvite.status, "pending"),
        isNull(tripInvite.deletedAt),
        isNull(trip.deletedAt),
        isNull(trip.archivedAt),
      ),
    );
  return row?.value ?? 0;
}

/** The one open invite this person holds for this trip, if any. */
export async function findPendingInvite(tripId: number, userId: string) {
  return db
    .select({
      tripId: tripInvite.tripId,
      fromUserId: tripInvite.fromUserId,
    })
    .from(tripInvite)
    .where(
      and(
        eq(tripInvite.tripId, tripId),
        eq(tripInvite.toUserId, userId),
        eq(tripInvite.status, "pending"),
        isNull(tripInvite.deletedAt),
      ),
    )
    .get();
}

/** `accepted` also written by the link path — joining via URL answers a name invite too, else it'd keep nagging. */
export async function settleInvite(
  tripId: number,
  userId: string,
  status: "accepted" | "declined",
): Promise<void> {
  await db
    .update(tripInvite)
    .set({ status, ...touch() })
    .where(
      and(
        eq(tripInvite.tripId, tripId),
        eq(tripInvite.toUserId, userId),
        eq(tripInvite.status, "pending"),
        isNull(tripInvite.deletedAt),
      ),
    );
}

/** Not the chrome badge — `AppChrome` reads `headers()` and is never cached, so a layout revalidate here would just waste every page's cache. */
export function revalidateInvites(): void {
  revalidatePath("/trips");
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

/** `mapPromptAt` parks the "keep these countries?" question for later (ticket 95) — leaving and being kicked leave the same mark since only they can answer it. */
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
 * Leaving (ticket 65) — succession and archiving applied together so they can't come apart.
 * Last admin leaving with others remaining: admin passes to earliest-joined (succession, not
 * a fifth power — rule 6). Last member out archives, never deletes, the trip.
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

/** Unmarking writes `available: false` rather than soft-deleting — the unique index ignores `deletedAt`, so a soft-deleted row would block re-marking that day. */
export type AvailabilityRow = {
  userId: string;
  date: string;
  available: boolean;
};

/** `false` rows come back too — Dates needs them to tell "said no" from "hasn't looked" (ticket 118). */
export async function listAvailability(tripId: number): Promise<AvailabilityRow[]> {
  const rows = await db
    .select({
      userId: availability.userId,
      date: availability.date,
      available: availability.available,
    })
    .from(availability)
    .where(and(eq(availability.tripId, tripId), isNull(availability.deletedAt)))
    .limit(LIMITS.availability)
    .all();
  return bounded(rows, "availability", `trip ${tripId}`);
}

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

/** Deliberately not filtered on `deletedAt` — the target row belongs to someone who's already left. */
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
 * Roster half of account deletion (ticket 06) — same succession rule as `leaveTripAs`,
 * but walks every trip at once and does not archive an emptied one (other rows stay
 * attributed to a placeholder; archiving on the account's behalf is nobody's decision).
 * A trip left with no admin is an accepted v1 edge case.
 */
export async function handOverAndLeaveAllTrips(userId: string): Promise<void> {
  const mine = await db
    .select({ tripId: tripMembership.tripId, role: tripMembership.role })
    .from(tripMembership)
    .where(and(eq(tripMembership.userId, userId), isNull(tripMembership.deletedAt)))
    .limit(LIMITS.tripsPerUser)
    .all();

  const adminTripIds = bounded(mine, "tripsPerUser", "user's trips")
    .filter((m) => m.role === "admin")
    .map((m) => m.tripId);

  if (adminTripIds.length > 0) {
    // One read for every trip administered, not a query+write per trip (ticket 114).
    const others = await db
      .select({
        tripId: tripMembership.tripId,
        userId: tripMembership.userId,
        role: tripMembership.role,
        createdAt: tripMembership.createdAt,
      })
      .from(tripMembership)
      .where(
        and(
          inArray(tripMembership.tripId, adminTripIds),
          ne(tripMembership.userId, userId),
          isNull(tripMembership.deletedAt),
        ),
      )
      .limit(LIMITS.members * adminTripIds.length)
      .all();

    const byTrip = new Map<number, typeof others>();
    for (const row of bounded(others, "members", "trips being handed over")) {
      byTrip.set(row.tripId, [...(byTrip.get(row.tripId) ?? []), row]);
    }

    const promotions: Promise<unknown>[] = [];
    for (const tripId of adminTripIds) {
      const roster = byTrip.get(tripId) ?? [];
      if (roster.length === 0 || roster.some((m) => m.role === "admin")) continue;

      const heir = roster.reduce((earliest, m) =>
        m.createdAt < earliest.createdAt ? m : earliest,
      );
      promotions.push(setMemberRoleAdmin(tripId, heir.userId));
    }
    await Promise.all(promotions); // distinct trips, cannot race each other
  }

  // No mapPromptAt here unlike removeMembership: there's no later to answer it in —
  // the account and its profile are both going in this same request (ticket 114).
  await db
    .update(tripMembership)
    .set({ deletedAt: new Date(), lastModifiedAt: new Date() })
    .where(eq(tripMembership.userId, userId));
}
