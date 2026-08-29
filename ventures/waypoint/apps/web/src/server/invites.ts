/**
 * Being asked onto a trip (ticket 242, split out of the old membership file).
 * Two doors: the forwardable share link (ticket 05), and the named invite that
 * `trip_invite` records (ticket 146).
 *
 * Rules owned here: an invite is not a membership — only accepting writes
 * `trip_membership`, and it does so through `roster.ts`; upsert never insert,
 * since `trip_invite_pair_idx` ignores `deleted_at`; `inviteToTrip` re-filters
 * the roster because the form is reachable without its page (ticket 113).
 *
 * Walking through the door is one operation (`acceptInvite` / `joinWithLink`),
 * not a sequence for each caller to get right.
 */
import "server-only";

import { and, count, eq, inArray, isNull } from "drizzle-orm";

import { db } from "@/db";
import { trip, tripInvite, tripMembership, user, userProfile } from "@/db/schema";
import { bounded, LIMITS } from "@/server/limits";
import { touch } from "@/server/audit";
import { refresh } from "@/server/freshness";
import { ensureProfile } from "@/server/profile";
import { addMember } from "@/server/roster";

/* --------------------------------------------------------- the share link */

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

/* -------------------------------------------------------- the named invite */

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

/** Closes the open invite, if there is one. Not exported: answering is `acceptInvite`/`declineInvite`. */
async function settleInvite(
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

/* ------------------------------------------------------ walking in the door */

/**
 * Everything joining a trip means, whichever door was used. The profile is
 * lazy for anyone who joined by link before signup wired one up; settling
 * covers somebody asked by name who used the link instead — a pending row left
 * behind would keep badging the chrome for a trip they are already on.
 */
async function admit(tripId: number, userId: string): Promise<void> {
  await addMember(tripId, userId);
  await ensureProfile(userId);
  await settleInvite(tripId, userId, "accepted");

  refresh(
    { kind: "invites" },
    { kind: "tripList" },
    { kind: "tripOverview", tripId },
  );
}

/**
 * The named invite answered yes. Gated on a live pending row, so a guessed trip
 * id buys no membership (rule 5) — `false` means there was nothing to accept.
 */
export async function acceptInvite(tripId: number, userId: string): Promise<boolean> {
  if (!(await findPendingInvite(tripId, userId))) return false;
  await admit(tripId, userId);
  return true;
}

/**
 * The share link redeemed. No pending row needed — anyone holding the token may
 * join (ticket 05); the caller checks the token resolves and the inbox is
 * verified (ticket 149) before getting here.
 */
export async function joinWithLink(tripId: number, userId: string): Promise<void> {
  await admit(tripId, userId);
}

/** Closes the invite, joins nothing — an admin may ask again. */
export async function declineInvite(tripId: number, userId: string): Promise<void> {
  await settleInvite(tripId, userId, "declined");
  refresh({ kind: "invites" });
}
