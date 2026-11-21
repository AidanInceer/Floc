import type { AvatarIcon } from "@floc/core/people/avatar-icon";
import "server-only";

import { Refusal } from "@floc/core/errors/refusal";

import { and, count, eq, inArray, isNull } from "drizzle-orm";

import { db } from "@/db";
import { trip, tripInvite, tripMembership, user, userProfile } from "@/db/schema";
import { bounded, LIMITS } from "@/server/limits";
import { touch } from "@/server/audit";
import { refresh } from "@/server/freshness";
import { ensureProfile } from "@/server/auth/profile";
import { addMember, countMembers } from "@/server/trips/roster";
import { isLiveMember } from "@/server/trips/live-member";
import { invitableIdsOf } from "@/server/social/groups";
import { recordActivity } from "@/server/notifications/activity";
import { readShareToken } from "@/server/trips/invite-link";

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
    .where(and(eq(trip.inviteToken, token), isNull(trip.deletedAt), isNull(trip.archivedAt)))
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

export async function findTripByShareLink(link: string, now = Date.now()): Promise<InviteTrip | undefined> {
  const token = readShareToken(link, now);
  return token ? findTripByInviteToken(token) : undefined;
}

export type PendingInvite = {
  tripId: number;
  tripName: string;
  startDate: string | null;
  endDate: string | null;
  fromUserId: string;
  fromName: string;
  fromAvatarIcon: AvatarIcon | null;
  invitedAt: Date;
};

export async function inviteToTrip(args: {
  tripId: number;
  fromUserId: string;
  toUserIds: string[];
}): Promise<number> {
  const { tripId, fromUserId } = args;

  const requested = [...new Set(args.toUserIds)];
  const invitable = await invitableIdsOf(fromUserId, requested);
  const wanted = requested.filter((id) => invitable.has(id));
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

  await db.transaction(async (tx) => {
    await tx
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
    await recordActivity(tx, {
      kind: "trip_invited",
      tripId,
      actorId: fromUserId,
      subjectId: null,
      href: "/trips",
      affected: toInvite,
    });
  });

  return toInvite.length;
}

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
      fromAvatarIcon: userProfile.avatarIcon,
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
    fromAvatarIcon: r.fromAvatarIcon,
    invitedAt: r.invitedAt,
  }));
}

export type PendingInvitee = {
  userId: string;
  name: string;
  avatarIcon: AvatarIcon | null;
};

type InviteAnswer = "pending" | "declined";

export async function listPendingInvitees(tripId: number): Promise<PendingInvitee[]> {
  return (await inviteesWith(tripId, ["pending"])).pending;
}

export async function listDeclinedInvitees(tripId: number): Promise<PendingInvitee[]> {
  return (await inviteesWith(tripId, ["declined"])).declined;
}

export async function listInviteesByAnswer(tripId: number): Promise<Record<InviteAnswer, PendingInvitee[]>> {
  return inviteesWith(tripId, ["pending", "declined"]);
}

async function inviteesWith(tripId: number, answers: InviteAnswer[]): Promise<Record<InviteAnswer, PendingInvitee[]>> {
  const rows = await db
    .select({
      userId: tripInvite.toUserId,
      status: tripInvite.status,
      name: user.name,
      displayName: userProfile.displayName,
      avatarIcon: userProfile.avatarIcon,
    })
    .from(tripInvite)
    .innerJoin(user, eq(user.id, tripInvite.toUserId))
    .leftJoin(userProfile, eq(userProfile.userId, tripInvite.toUserId))
    .where(and(eq(tripInvite.tripId, tripId), inArray(tripInvite.status, answers), isNull(tripInvite.deletedAt)))
    .limit(LIMITS.invites * answers.length)
    .all();

  const out: Record<InviteAnswer, PendingInvitee[]> = { pending: [], declined: [] };
  for (const r of rows) {
    if (r.status !== "pending" && r.status !== "declined") continue;
    out[r.status].push({ userId: r.userId, name: r.displayName ?? r.name, avatarIcon: r.avatarIcon });
  }
  bounded(out.pending, "invites", `trip ${tripId}`);
  bounded(out.declined, "invites", `trip ${tripId}`);
  return out;
}

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

async function admit(tripId: number, userId: string): Promise<void> {
  if ((await countMembers(tripId)) >= LIMITS.members) throw new Refusal("This trip is full.");
  await addMember(tripId, userId);
  await ensureProfile(userId);
  await settleInvite(tripId, userId, "accepted");

  refresh(
    { kind: "invites" },
    { kind: "tripList" },
    { kind: "tripOverview", tripId },
  );
}

export async function acceptInvite(tripId: number, userId: string): Promise<boolean> {
  if (!(await findPendingInvite(tripId, userId))) return false;
  await admit(tripId, userId);
  return true;
}

async function takesNewPeople(tripId: number): Promise<boolean> {
  const open = await db
    .select({ id: trip.id })
    .from(trip)
    .where(and(eq(trip.id, tripId), isNull(trip.deletedAt), isNull(trip.archivedAt)))
    .get();
  return open !== undefined;
}

export async function joinWithLink(tripId: number, userId: string): Promise<void> {
  if (await isLiveMember(tripId, userId)) return;
  if (!(await takesNewPeople(tripId))) throw new Refusal("This trip is not taking new people.");
  await admit(tripId, userId);
}

export async function declineInvite(tripId: number, userId: string): Promise<void> {
  await settleInvite(tripId, userId, "declined");
  refresh({ kind: "invites" });
}
