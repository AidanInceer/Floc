/**
 * Session and trip-membership gating (ticket 05). Unauthenticated → redirect
 * to login, revealing nothing. Authenticated non-member → same generic
 * response whether the trip id is real or fake, so ids can't be enumerated.
 */
import "server-only";

import { and, eq, inArray, isNull } from "drizzle-orm";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";

import { db } from "@/db";
import {
  day,
  dayEvent,
  expense,
  idea,
  note,
  packingLine,
  trip,
  tripMembership,
  user,
  userProfile,
} from "@/db/schema";
import { auth } from "@/server/auth";
import { bounded, LIMITS } from "@/server/limits";
import { dietarySummary, readDietFlags } from "@/lib/dietary";
import { whoTone } from "@/lib/who";
import type { TripRole } from "@/db/schema";

export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

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

export type TripAccess = {
  trip: typeof trip.$inferSelect;
  role: TripRole;
  isAdmin: boolean;
  viewer: { id: string; name: string; email: string; image: string | null };
  members: TripMember[];
  /**
   * Resolvers that can only produce rows belonging to *this* trip (ticket 106).
   * Binding a child id back to its trip used to be an unwritten obligation on
   * ~70 call sites; six forgot (ticket 104). These move the join inside so the
   * unsafe form isn't expressible. Each returns the row or `notFound()` — same
   * response as nonexistent, keeping child ids non-enumerable (rule 5) — and
   * filters `deletedAt` (rule 8).
   */
  day: (dayId: number) => Promise<typeof day.$inferSelect>;
  event: (eventId: number) => Promise<typeof dayEvent.$inferSelect>;
  idea: (ideaId: number) => Promise<typeof idea.$inferSelect>;
  expense: (expenseId: number) => Promise<typeof expense.$inferSelect>;
  note: (noteId: number) => Promise<typeof note.$inferSelect>;
  packingLine: (lineId: number) => Promise<typeof packingLine.$inferSelect>;
};

export type TripMember = {
  userId: string;
  role: TripRole;
  name: string;
  email: string;
  avatarUrl: string | null;
  joinedAt: Date;
  /** Roster-position colour (ticket 11) — pass through rather than letting `Avatar` hash the name. */
  tone: string;
  /** Never on a profile page — a functional attribute a group picking where to eat needs (ticket 46). */
  dietary: string | null;
};

/**
 * Keyed only on trip + viewer. `redirectTo` deliberately excluded: `cache()`
 * keys on every argument, so with it on `requireTripAccess`, layout and page
 * calls were different keys and every non-Overview tab ran the lookups twice
 * per navigation. Redirect path is the caller's property, not the data's.
 */
const loadTripAccess = cache(async function loadTripAccess(
  id: number,
  viewerId: string,
) {
  // Three independent lookups run together; the membership check still gates
  // the response, it just no longer makes the other two wait their turn.
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

/**
 * The only sanctioned way to load a trip in a page or action. Non-members get
 * `notFound()`, identical to a trip that does not exist. Resolved twice per
 * navigation (layout + page); dedupe lives in `loadTripAccess` above.
 */
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
    ...scopedTo(id),
  };
}

/**
 * The resolvers on `TripAccess`, built for one trip id — see the type's doc.
 * Each is memoised with `cache()`, keyed on trip + child id, since several
 * actions resolve the same row more than once. `event` reaches `trip` through
 * its day rather than a direct column — the shape ticket 104 fixed by hand.
 */
const resolveDay = cache(async (tripId: number, dayId: number) => {
  const row = await db
    .select()
    .from(day)
    .where(and(eq(day.id, dayId), eq(day.tripId, tripId), isNull(day.deletedAt)))
    .get();
  if (!row) notFound();
  return row;
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
  if (!row) notFound();
  return row.event;
});

const resolveIdea = cache(async (tripId: number, ideaId: number) => {
  const row = await db
    .select()
    .from(idea)
    .where(
      and(eq(idea.id, ideaId), eq(idea.tripId, tripId), isNull(idea.deletedAt)),
    )
    .get();
  if (!row) notFound();
  return row;
});

const resolvePackingLine = cache(async (tripId: number, lineId: number) => {
  const row = await db
    .select()
    .from(packingLine)
    .where(
      and(
        eq(packingLine.id, lineId),
        eq(packingLine.tripId, tripId),
        isNull(packingLine.deletedAt),
      ),
    )
    .get();
  if (!row) notFound();
  return row;
});

const resolveExpense = cache(async (tripId: number, expenseId: number) => {
  const row = await db
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
  if (!row) notFound();
  return row;
});

/** Deliberately doesn't check that `scope_id` points into the same trip — that invariant belongs to whoever writes the scope. */
const resolveNote = cache(async (tripId: number, noteId: number) => {
  const row = await db
    .select()
    .from(note)
    .where(
      and(eq(note.id, noteId), eq(note.tripId, tripId), isNull(note.deletedAt)),
    )
    .get();
  if (!row) notFound();
  return row;
});

function scopedTo(tripId: number) {
  return {
    day: (dayId: number) => resolveDay(tripId, dayId),
    event: (eventId: number) => resolveEvent(tripId, eventId),
    idea: (ideaId: number) => resolveIdea(tripId, ideaId),
    expense: (expenseId: number) => resolveExpense(tripId, expenseId),
    note: (noteId: number) => resolveNote(tripId, noteId),
    packingLine: (lineId: number) => resolvePackingLine(tripId, lineId),
  };
}

/** The roster join, shared by the single-trip and multi-trip loaders. */
function memberQuery() {
  return db
    .select({
      tripId: tripMembership.tripId,
      userId: tripMembership.userId,
      role: tripMembership.role,
      joinedAt: tripMembership.createdAt,
      name: user.name,
      email: user.email,
      image: user.image,
      displayName: userProfile.displayName,
      avatarUrl: userProfile.avatarUrl,
      dietFlags: userProfile.dietFlags,
      dietaryNotes: userProfile.dietaryNotes,
      shareDietary: userProfile.shareDietary,
    })
    .from(tripMembership)
    .innerJoin(user, eq(user.id, tripMembership.userId))
    .leftJoin(userProfile, eq(userProfile.userId, tripMembership.userId));
}

type MemberRow = Awaited<ReturnType<ReturnType<typeof memberQuery>["all"]>>[number];

/** Sort + seat-colour assignment, shared by both loaders below. */
function toRoster(rows: MemberRow[]): TripMember[] {
  return rows
    .map((r) => ({
      userId: r.userId,
      role: r.role,
      name: r.displayName ?? r.name,
      email: r.email,
      avatarUrl: r.avatarUrl ?? r.image ?? null,
      joinedAt: r.joinedAt,
      dietary: r.shareDietary
        ? dietarySummary(readDietFlags(r.dietFlags), r.dietaryNotes)
        : null,
    }))
    // Earliest-joined first, same order sole-admin promotion uses (ticket 06).
    .sort(
      (a, b) =>
        a.joinedAt.getTime() - b.joinedAt.getTime() ||
        a.userId.localeCompare(b.userId),
    )
    // Colour by identity, not seat, so a person is the same colour everywhere
    // — every roster and the account header (whoTone). Occasional within-trip
    // clashes are acceptable: colour is never the only way people are told apart.
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

/** One query, not an N+1 per trip card — grouping in JS keeps seat colours identical to the single-trip loader. */
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
    .limit(LIMITS.members * tripIds.length) // ceiling is per trip (ticket 108)
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

/** Admin-only powers (ticket 01 step 7): invite, kick, promote, archive/restore, delete. */
export function assertAdmin(access: TripAccess): void {
  if (!access.isAdmin) {
    throw new Error("Only a trip admin can do that");
  }
}
