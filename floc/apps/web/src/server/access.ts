import type { AvatarIcon } from "@floc/core/people/avatar-icon";
import "server-only";

import { Refusal } from "@floc/core/errors/refusal";

import { and, eq, inArray, isNull, or } from "drizzle-orm";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";

import { db } from "@/db";
import {
  comment,
  day,
  dayEvent,
  document,
  expense,
  packingLine,
  trip,
  tripMembership,
  user,
  userProfile,
} from "@/db/schema";
import { auth } from "@/server/auth/auth";
import { memberSession } from "@/server/auth/member-session";
import { bounded, LIMITS } from "@/server/limits";
import { AlreadyRemoved, isRemovedDay, isRemovedEvent, isRemovedPackingLine } from "@/server/removed-rows";
import { requestMemo } from "@/server/request-scope";
import { localPath } from "@floc/core/text/local-path";
import { whoTone } from "@floc/core/people/who";
import type { TripRole } from "@/db/schema";

const getRawSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

export const getSession = cache(async () => memberSession(await getRawSession()));

export async function memberSessionStart(): Promise<{ userId: string; startedAt: Date } | null> {
  const raw = await getRawSession();
  if (!raw || raw.user.isAnonymous) return null;
  return { userId: raw.user.id, startedAt: new Date(raw.session.createdAt) };
}

export async function getInviteGuest(): Promise<{ id: string; name: string } | null> {
  const session = await getRawSession();
  if (!session?.user?.isAnonymous) return null;
  const row = await db
    .select({ id: user.id, name: user.name })
    .from(user)
    .where(and(eq(user.id, session.user.id), eq(user.isAnonymous, true)))
    .get();
  return row ?? null;
}

export async function requireUser(redirectTo?: string) {
  const session = await getSession();
  if (!session?.user) {
    const target = redirectTo
      ? `/login?redirect=${encodeURIComponent(redirectTo)}`
      : "/login";
    redirect(target);
  }
  return session.user;
}

export async function requireGuest(next?: string) {
  const session = await getSession();
  if (session?.user) redirect(localPath(next, "/trips"));
}

export type TripAccess = {
  trip: typeof trip.$inferSelect;
  role: TripRole;
  isAdmin: boolean;
  viewer: { id: string; name: string; email: string; image: string | null };
  members: TripMember[];
  day: (dayId: number) => Promise<typeof day.$inferSelect>;
  event: (eventId: number) => Promise<typeof dayEvent.$inferSelect>;
  expense: (expenseId: number) => Promise<typeof expense.$inferSelect>;
  note: (noteId: number) => Promise<typeof comment.$inferSelect>;
  packingLine: (lineId: number) => Promise<typeof packingLine.$inferSelect>;
  document: (documentId: number) => Promise<typeof document.$inferSelect>;
};

export type TripMember = {
  userId: string;
  role: TripRole;
  name: string;
  avatarIcon: AvatarIcon | null;
  joinedAt: Date;
  tone: string;
};

const loadTripAccess = cache(async function loadTripAccess(
  id: number,
  viewerId: string,
) {
  const [membership, row, members] = await Promise.all([
    db
      .select({ role: tripMembership.role })
      .from(tripMembership)
      .where(
        and(
          eq(tripMembership.tripId, id),
          eq(tripMembership.userId, viewerId),
          isNull(tripMembership.deletedAt),
        ),
      )
      .get(),
    db
      .select()
      .from(trip)
      .where(and(eq(trip.id, id), isNull(trip.deletedAt)))
      .get(),
    listMembers(id),
  ]);

  return { membership, row, members };
});

export async function requireTripAccess(
  tripId: number | string,
  redirectTo?: string,
): Promise<TripAccess> {
  const id = Number(tripId);
  const viewer = await requireUser(redirectTo);
  if (!Number.isInteger(id)) notFound();

  const { membership, row, members } = await loadTripAccess(id, viewer.id);

  if (!membership) notFound();
  if (!row) notFound();

  return {
    trip: row,
    role: membership.role,
    isAdmin: membership.role === "admin",
    viewer: {
      id: viewer.id,
      name: viewer.name,
      email: viewer.email,
      image: viewer.image ?? null,
    },
    members,
    ...scopedTo(id, viewer.id, notFound),
  };
}

export async function findTripAccess(
  tripId: number,
  viewerId: string,
): Promise<TripAccess | null> {
  if (!Number.isInteger(tripId)) return null;
  return requestMemo(`trip-access:${tripId}:${viewerId}`, () => loadFoundAccess(tripId, viewerId));
}

async function loadFoundAccess(tripId: number, viewerId: string): Promise<TripAccess | null> {

  const { membership, row, members } = await loadTripAccess(tripId, viewerId);
  if (!membership || !row) return null;

  const viewer = await db
    .select({ id: user.id, name: user.name, email: user.email, image: user.image, isAnonymous: user.isAnonymous })
    .from(user)
    .where(eq(user.id, viewerId))
    .get();
  if (!viewer || viewer.isAnonymous) return null;

  return {
    trip: row,
    role: membership.role,
    isAdmin: membership.role === "admin",
    viewer: { id: viewer.id, name: viewer.name, email: viewer.email, image: viewer.image ?? null },
    members,
    ...scopedTo(tripId, viewerId, refuseMissing),
  };
}

const resolveDay = cache(async (tripId: number, dayId: number) => {
  return db
    .select()
    .from(day)
    .where(and(eq(day.id, dayId), eq(day.tripId, tripId), isNull(day.deletedAt)))
    .get();
});

const resolveEvent = cache(async (tripId: number, eventId: number) => {
  const row = await db
    .select({ event: dayEvent })
    .from(dayEvent)
    .innerJoin(day, eq(day.id, dayEvent.dayId))
    .where(
      and(
        eq(dayEvent.id, eventId),
        eq(day.tripId, tripId),
        isNull(dayEvent.deletedAt),
        isNull(day.deletedAt),
      ),
    )
    .get();
  return row?.event;
});

const resolvePackingLine = cache(
  async (tripId: number, viewerId: string, lineId: number) => {
    return db
      .select()
      .from(packingLine)
      .where(
        and(
          eq(packingLine.id, lineId),
          eq(packingLine.tripId, tripId),
          or(
            isNull(packingLine.ownerId),
            eq(packingLine.ownerId, viewerId),
          ),
          isNull(packingLine.deletedAt),
        ),
      )
      .get();
  },
);

const resolveDocument = cache(
  async (tripId: number, viewerId: string, documentId: number) => {
    return db
      .select()
      .from(document)
      .where(
        and(
          eq(document.id, documentId),
          eq(document.tripId, tripId),
          or(isNull(document.ownerId), eq(document.ownerId, viewerId)),
          isNull(document.deletedAt),
        ),
      )
      .get();
  },
);

const resolveExpense = cache(async (tripId: number, expenseId: number) => {
  return db
    .select()
    .from(expense)
    .where(
      and(
        eq(expense.id, expenseId),
        eq(expense.tripId, tripId),
        isNull(expense.deletedAt),
      ),
    )
    .get();
});

const resolveNote = cache(async (tripId: number, noteId: number) => {
  return db
    .select()
    .from(comment)
    .where(
      and(eq(comment.id, noteId), eq(comment.tripId, tripId), isNull(comment.deletedAt)),
    )
    .get();
});

type WasRemoved = () => Promise<boolean>;
type Missing = (wasRemoved: WasRemoved) => never | Promise<never>;

const refuseMissing: Missing = () => {
  throw new Refusal("That is not on this trip.", "missing");
};

const removedOrNotFound: Missing = async (wasRemoved) => {
  if (await wasRemoved()) throw new AlreadyRemoved();
  notFound();
};

const neverRemoved: WasRemoved = async () => false;

function scopedTo(tripId: number, viewerId: string, missing: Missing) {
  const found = async <T>(row: Promise<T | undefined>, wasRemoved: WasRemoved = neverRemoved): Promise<T> =>
    (await row) ?? missing(wasRemoved);
  return {
    day: (dayId: number) => found(resolveDay(tripId, dayId), () => isRemovedDay(tripId, dayId)),
    event: (eventId: number) => found(resolveEvent(tripId, eventId), () => isRemovedEvent(tripId, eventId)),
    expense: (expenseId: number) => found(resolveExpense(tripId, expenseId)),
    note: (noteId: number) => found(resolveNote(tripId, noteId)),
    packingLine: (lineId: number) =>
      found(resolvePackingLine(tripId, viewerId, lineId), () => isRemovedPackingLine(tripId, viewerId, lineId)),
    document: (documentId: number) => found(resolveDocument(tripId, viewerId, documentId)),
  };
}

export async function requireTripEdit(tripId: number | string): Promise<TripAccess> {
  const access = await requireTripAccess(tripId);
  return { ...access, ...scopedTo(access.trip.id, access.viewer.id, removedOrNotFound) };
}

function memberQuery() {
  return db
    .select({
      tripId: tripMembership.tripId,
      userId: tripMembership.userId,
      role: tripMembership.role,
      joinedAt: tripMembership.createdAt,
      name: user.name,
      image: user.image,
      displayName: userProfile.displayName,
      avatarIcon: userProfile.avatarIcon,
    })
    .from(tripMembership)
    .innerJoin(user, eq(user.id, tripMembership.userId))
    .leftJoin(userProfile, eq(userProfile.userId, tripMembership.userId));
}

type MemberRow = Awaited<ReturnType<ReturnType<typeof memberQuery>["all"]>>[number];

function toRoster(rows: MemberRow[]): TripMember[] {
  return rows
    .map((r) => ({
      userId: r.userId,
      role: r.role,
      name: r.displayName ?? r.name,
      avatarIcon: r.avatarIcon,
      joinedAt: r.joinedAt,
    }))
    .sort(
      (a, b) =>
        a.joinedAt.getTime() - b.joinedAt.getTime() ||
        a.userId.localeCompare(b.userId),
    )
    .map((m) => ({ ...m, tone: whoTone(m.name) }));
}

const listMembers = cache(async function listMembers(
  tripId: number,
): Promise<TripMember[]> {
  const rows = await memberQuery()
    .where(
      and(eq(tripMembership.tripId, tripId), isNull(tripMembership.deletedAt)),
    )
    .limit(LIMITS.members)
    .all();

  return toRoster(bounded(rows, "members", `trip ${tripId}`));
});

export const listMembersFor = cache(async function listMembersFor(
  tripIds: number[],
): Promise<Map<number, TripMember[]>> {
  const byTrip = new Map<number, TripMember[]>();
  if (tripIds.length === 0) return byTrip;

  const rows = await memberQuery()
    .where(
      and(
        inArray(tripMembership.tripId, tripIds),
        isNull(tripMembership.deletedAt),
      ),
    )
    .limit(LIMITS.members * tripIds.length)
    .all();

  const grouped = new Map<number, MemberRow[]>();
  for (const r of rows) {
    const list = grouped.get(r.tripId);
    if (list) list.push(r);
    else grouped.set(r.tripId, [r]);
  }

  for (const id of tripIds) byTrip.set(id, toRoster(grouped.get(id) ?? []));
  return byTrip;
});

export function assertAdmin(access: TripAccess): void {
  if (!access.isAdmin) {
    throw new Refusal("Only a trip admin can do that.", "forbidden");
  }
}
