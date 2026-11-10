/**
 * Named groups of people you travel with (#545). A group is its maker's private shortcut for
 * ticking people on a new trip: nobody in it is told, and nobody else can see it.
 *
 * Who can be in one is re-derived at every read (rule 4): your friends, plus people on a live trip
 * with you, never a guest (ADR-029). Someone who drops out of that set keeps their row and is hidden.
 */
import "server-only";

import { and, count, desc, eq, inArray, isNotNull, isNull, lt, ne, notInArray } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";

import { db } from "@/db";
import { friendGroup, friendGroupMember, trip, tripMembership, user } from "@/db/schema";
import { Refusal } from "@floc/core/errors/refusal";
import { GROUP_NAME_CAP } from "@floc/core/people/group-ticks";
import { touch } from "@/server/audit";
import { assertRoom, LIMITS } from "@/server/limits";
import { acceptedFriendIdsOf, peopleByIds, type Person } from "@/server/social/friends";

const STRANGER = "You can only add friends and people on a trip with you.";
const GONE = "That group is gone.";

/** One self-join over the viewer's live trips — the people they could ask along without a friendship. */
async function liveCoMemberIds(viewerId: string, candidates?: string[]): Promise<string[]> {
  const mine = alias(tripMembership, "mine");
  const rows = await db
    .selectDistinct({ userId: tripMembership.userId })
    .from(mine)
    .innerJoin(trip, eq(trip.id, mine.tripId))
    .innerJoin(tripMembership, eq(tripMembership.tripId, mine.tripId))
    .innerJoin(user, eq(user.id, tripMembership.userId))
    .where(
      and(
        eq(mine.userId, viewerId),
        isNull(mine.deletedAt),
        isNull(trip.deletedAt),
        isNull(tripMembership.deletedAt),
        ne(tripMembership.userId, viewerId),
        eq(user.isAnonymous, false),
        candidates ? inArray(tripMembership.userId, candidates) : undefined,
      ),
    )
    .limit(LIMITS.members * LIMITS.tripsPerUser)
    .all();
  return rows.map((r) => r.userId);
}

/** Friends and live co-members, minus yourself and guests. The one gate for groups and for asking someone onto a trip. */
export async function invitableIdsOf(viewerId: string, candidates?: string[]): Promise<Set<string>> {
  if (candidates?.length === 0) return new Set();
  const [friends, coMembers] = await Promise.all([acceptedFriendIdsOf(viewerId), liveCoMemberIds(viewerId, candidates)]);
  const requested = candidates ? new Set(candidates) : null;
  const friendIds = friends.filter((id) => id !== viewerId && (!requested || requested.has(id)));
  if (friendIds.length === 0) return new Set(coMembers);

  const eligibleFriends = await db
    .select({ id: user.id })
    .from(user)
    .where(and(inArray(user.id, friendIds), eq(user.isAnonymous, false)))
    .limit(friendIds.length)
    .all();
  return new Set([...coMembers, ...eligibleFriends.map(({ id }) => id)]);
}

export type GroupInput = { name: string; memberIds: string[] };

/** Validates at the door: a name, somebody in it, nobody you could not ask anyway, and the cap. */
async function checked(ownerId: string, input: GroupInput): Promise<GroupInput> {
  const name = input.name.trim();
  if (!name) throw new Refusal("Give the group a name.", "invalid");
  if (name.length > GROUP_NAME_CAP) throw new Refusal(`Use ${GROUP_NAME_CAP} characters or fewer for the group name.`, "invalid");
  const memberIds = [...new Set(input.memberIds)];
  if (memberIds.length === 0) throw new Refusal("Pick at least one person.", "invalid");
  assertRoom("friendGroupMembers", 0, memberIds.length);

  const invitable = await invitableIdsOf(ownerId, memberIds);
  if (memberIds.some((id) => !invitable.has(id))) throw new Refusal(STRANGER, "forbidden");
  return { name, memberIds };
}

function ownedGroup(ownerId: string, groupId: number) {
  return and(eq(friendGroup.id, groupId), eq(friendGroup.ownerUserId, ownerId), isNull(friendGroup.deletedAt));
}

/** Someone else's group and a deleted one get the same answer, so ids cannot be probed (rule 5). */
async function assertOwned(ownerId: string, groupId: number, reader: Pick<typeof db, "select"> = db): Promise<void> {
  const row = await reader.select({ id: friendGroup.id }).from(friendGroup).where(ownedGroup(ownerId, groupId)).get();
  if (!row) throw new Refusal(GONE, "missing");
}

export async function createGroup(ownerId: string, input: GroupInput): Promise<number> {
  const { name, memberIds } = await checked(ownerId, input);
  return db.transaction(async (tx) => {
    const [{ n }] = await tx
      .select({ n: count() })
      .from(friendGroup)
      .where(and(eq(friendGroup.ownerUserId, ownerId), isNull(friendGroup.deletedAt)));
    assertRoom("friendGroups", n);
    const group = await tx.insert(friendGroup).values({ ownerUserId: ownerId, name }).returning({ id: friendGroup.id }).get();
    await tx.insert(friendGroupMember).values(memberIds.map((userId) => ({ groupId: group.id, userId })));
    return group.id;
  });
}

export async function saveGroup(ownerId: string, groupId: number, input: GroupInput): Promise<void> {
  const { name, memberIds } = await checked(ownerId, input);

  await db.transaction(async (tx) => {
    await assertOwned(ownerId, groupId, tx);
    await tx.update(friendGroup).set({ name, ...touch() }).where(ownedGroup(ownerId, groupId));
    await tx
      .insert(friendGroupMember)
      .values(memberIds.map((userId) => ({ groupId, userId })))
      .onConflictDoUpdate({
        target: [friendGroupMember.groupId, friendGroupMember.userId],
        set: { deletedAt: null, ...touch() },
      });
    await tx
      .update(friendGroupMember)
      .set({ deletedAt: new Date(), ...touch() })
      .where(
        and(
          eq(friendGroupMember.groupId, groupId),
          isNull(friendGroupMember.deletedAt),
          notInArray(friendGroupMember.userId, memberIds),
        ),
      );
  });
}

async function liveMemberIds(groupId: number, reader: Pick<typeof db, "select">): Promise<string[]> {
  const rows = await reader
    .select({ userId: friendGroupMember.userId })
    .from(friendGroupMember)
    .where(and(eq(friendGroupMember.groupId, groupId), isNull(friendGroupMember.deletedAt)))
    .limit(LIMITS.friendGroupMembers)
    .all();
  return rows.map((r) => r.userId);
}

/** The friend row's "Add to group" tick: one person in or out, the rest left as they are. */
export async function setGroupMember(ownerId: string, groupId: number, userId: string, on: boolean): Promise<void> {
  const allowed = !on || (await invitableIdsOf(ownerId, [userId])).has(userId);
  await db.transaction(async (tx) => {
    await assertOwned(ownerId, groupId, tx);
    if (on) {
      const current = await liveMemberIds(groupId, tx);
      if (current.includes(userId)) return;
      if (!allowed) throw new Refusal(STRANGER, "forbidden");
      assertRoom("friendGroupMembers", current.length);
      await tx
        .insert(friendGroupMember)
        .values({ groupId, userId })
        .onConflictDoUpdate({
          target: [friendGroupMember.groupId, friendGroupMember.userId],
          set: { deletedAt: null, ...touch() },
        });
    } else {
      await tx
        .update(friendGroupMember)
        .set({ deletedAt: new Date(), ...touch() })
        .where(
          and(
            eq(friendGroupMember.groupId, groupId),
            eq(friendGroupMember.userId, userId),
            isNull(friendGroupMember.deletedAt),
          ),
        );
    }
    await tx.update(friendGroup).set(touch()).where(ownedGroup(ownerId, groupId));
  });
}

/** Soft delete (rule 8). The member rows stay; the group's `deleted_at` hides them all. */
export async function deleteGroup(ownerId: string, groupId: number): Promise<void> {
  await assertOwned(ownerId, groupId);
  await db
    .update(friendGroup)
    .set({ deletedAt: new Date(), ...touch() })
    .where(ownedGroup(ownerId, groupId));
}

export type Group = { id: number; name: string; members: Person[] };

export async function touchUsedGroups(ownerId: string, groupIds: number[], invitedIds: string[]): Promise<void> {
  const used = db
    .select({ id: friendGroupMember.groupId })
    .from(friendGroupMember)
    .where(and(inArray(friendGroupMember.groupId, groupIds), inArray(friendGroupMember.userId, invitedIds), isNull(friendGroupMember.deletedAt)))
    .limit(LIMITS.friendGroups * LIMITS.friendGroupMembers);
  await db.update(friendGroup).set(touch()).where(and(
    eq(friendGroup.ownerUserId, ownerId), isNull(friendGroup.deletedAt), inArray(friendGroup.id, used),
  ));
}

/** The maker's live groups, last changed first, each with only the people who can still be asked. */
export async function listGroupsFor(ownerId: string): Promise<Group[]> {
  const groups = await db
    .select({ id: friendGroup.id, name: friendGroup.name })
    .from(friendGroup)
    .where(and(eq(friendGroup.ownerUserId, ownerId), isNull(friendGroup.deletedAt)))
    .orderBy(desc(friendGroup.lastModifiedAt), desc(friendGroup.id))
    .limit(LIMITS.friendGroups)
    .all();
  if (groups.length === 0) return [];

  const rows = await db
    .select({ groupId: friendGroupMember.groupId, userId: friendGroupMember.userId })
    .from(friendGroupMember)
    .where(and(inArray(friendGroupMember.groupId, groups.map((g) => g.id)), isNull(friendGroupMember.deletedAt)))
    .limit(LIMITS.friendGroups * LIMITS.friendGroupMembers)
    .all();

  const invitable = await invitableIdsOf(ownerId, [...new Set(rows.map(({ userId }) => userId))]);
  const kept = rows.filter((r) => invitable.has(r.userId));
  const people = await peopleByIds(kept.map((r) => r.userId));
  return groups.map((g) => ({
    ...g,
    members: kept
      .filter((r) => r.groupId === g.id)
      .map((r) => people.get(r.userId))
      .filter((p): p is Person => !!p)
      .sort((a, b) => a.name.localeCompare(b.name, "en-GB", { sensitivity: "base" })),
  }));
}

export type PastTrip = { id: number; name: string; startDate: string | null; endDate: string; people: Person[] };

/** Trips you were on that have ended, newest first, with the people on them you can still ask. */
export async function listPastTripsFor(viewerId: string, todayIso: string): Promise<PastTrip[]> {
  const trips = await db
    .select({ id: trip.id, name: trip.name, startDate: trip.startDate, endDate: trip.endDate })
    .from(tripMembership)
    .innerJoin(trip, eq(trip.id, tripMembership.tripId))
    .where(
      and(
        eq(tripMembership.userId, viewerId),
        isNull(tripMembership.deletedAt),
        isNull(trip.deletedAt),
        isNotNull(trip.endDate),
        lt(trip.endDate, todayIso),
      ),
    )
    .orderBy(desc(trip.endDate))
    .limit(LIMITS.tripsPerUser)
    .all();
  if (trips.length === 0) return [];

  const roster = await db
    .select({ tripId: tripMembership.tripId, userId: tripMembership.userId })
    .from(tripMembership)
    .innerJoin(user, eq(user.id, tripMembership.userId))
    .where(
      and(
        inArray(tripMembership.tripId, trips.map((t) => t.id)),
        isNull(tripMembership.deletedAt),
        ne(tripMembership.userId, viewerId),
        eq(user.isAnonymous, false),
      ),
    )
    .limit(LIMITS.members * trips.length)
    .all();

  const people = await peopleByIds(roster.map((r) => r.userId));
  return trips.map((t) => ({
    ...t,
    endDate: t.endDate ?? "",
    people: roster
      .filter((r) => r.tripId === t.id)
      .map((r) => people.get(r.userId))
      .filter((p): p is Person => !!p),
  }));
}
