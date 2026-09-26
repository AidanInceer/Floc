/**
 * Session and trip-membership gating (ticket 05). Unauthenticated → redirect
 * to login, revealing nothing. Authenticated non-member → same generic
 * response whether the trip id is real or fake, so ids can't be enumerated.
 */

import type { AvatarIcon } from "@floc/core/people/avatar-icon";
import "server-only";

import { Refusal } from "@floc/core/errors/refusal";

import { and, eq, inArray, isNull, or } from "drizzle-orm";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";

import { db } from "@/db";
import {
  day,
  dayEvent,
  document,
  expense,
  note,
  packingLine,
  trip,
  tripMembership,
  user,
  userProfile,
} from "@/db/schema";
import { auth } from "@/server/auth/auth";
import { bounded, LIMITS } from "@/server/limits";
import { requestMemo } from "@/server/request-scope";
import { dietarySummary, readDietFlags } from "@floc/core/people/dietary";
import { localPath } from "@floc/core/text/local-path";
import { whoTone } from "@floc/core/people/who";
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

/**
 * The other door: a signed-in person has no business on the sign-in pages.
 * Back-button history used to land them there and let them become somebody
 * else without signing out first (#403).
 */
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
  /**
   * Resolvers that can only produce rows belonging to *this* trip (ticket 106).
   * Binding a child id back to its trip used to be an unwritten obligation on
   * ~70 call sites; six forgot (ticket 104). These move the join inside so the
   * unsafe form isn't expressible. Each returns the row or the door's "not found" —
   * same response as nonexistent, keeping child ids non-enumerable (rule 5) — and
   * filters `deletedAt` (rule 8).
   */
  day: (dayId: number) => Promise<typeof day.$inferSelect>;
  event: (eventId: number) => Promise<typeof dayEvent.$inferSelect>;
  expense: (expenseId: number) => Promise<typeof expense.$inferSelect>;
  note: (noteId: number) => Promise<typeof note.$inferSelect>;
  packingLine: (lineId: number) => Promise<typeof packingLine.$inferSelect>;
  document: (documentId: number) => Promise<typeof document.$inferSelect>;
};

export type TripMember = {
  userId: string;
  role: TripRole;
  name: string;
  email: string;
  avatarIcon: AvatarIcon | null;
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
    ...scopedTo(id, viewer.id, notFound),
  };
}

/**
 * The same load as `requireTripAccess`, answering `null` instead of leaving
 * through `notFound()` (ticket 287).
 *
 * The API needs the *decision*, not the redirect: a tRPC procedure has to turn
 * "no" into a NOT_FOUND on the wire, and `notFound()` throws a Next navigation
 * signal a route handler cannot catch. Rule 5 is unchanged and stays the
 * caller's to keep — a trip that does not exist and one the viewer is not in
 * both answer `null` here, so neither is distinguishable from the other.
 */
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
    .select({ id: user.id, name: user.name, email: user.email, image: user.image })
    .from(user)
    .where(eq(user.id, viewerId))
    .get();
  if (!viewer) return null;

  return {
    trip: row,
    role: membership.role,
    isAdmin: membership.role === "admin",
    viewer: { ...viewer, image: viewer.image ?? null },
    members,
    ...scopedTo(tripId, viewerId, refuseMissing),
  };
}

/**
 * The resolvers on `TripAccess`, built for one trip id — see the type's doc.
 * Each is memoised with `cache()`, keyed on trip + child id, since several
 * actions resolve the same row more than once. `event` reaches `trip` through
 * its day rather than a direct column — the shape ticket 104 fixed by hand.
 */
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

/**
 * Also scoped by owner (ticket 220): one table holds the shared list and every
 * member's personal one, so trip membership alone is no longer enough. A line
 * is reachable when it's shared (`owner_id is null`) or the viewer's own —
 * somebody else's bag answers exactly as a nonexistent id does (rule 5).
 */
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

/**
 * Same owner scoping as a packing line, and it is the whole of the privacy
 * guarantee: the serve route resolves the row through here before it reads a
 * byte, so another member's private file 404s exactly as a fake id does.
 */
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

/** Deliberately doesn't check that `scope_id` points into the same trip — that invariant belongs to whoever writes the scope. */
const resolveNote = cache(async (tripId: number, noteId: number) => {
  return db
    .select()
    .from(note)
    .where(
      and(eq(note.id, noteId), eq(note.tripId, tripId), isNull(note.deletedAt)),
    )
    .get();
});

/** How a door says "no such row": the web leaves through `notFound()`, the API refuses with a 404. */
type Missing = () => never;

const refuseMissing: Missing = () => {
  throw new Refusal("That is not on this trip.", "missing");
};

function scopedTo(tripId: number, viewerId: string, missing: Missing) {
  const found = async <T>(row: Promise<T | undefined>): Promise<T> => (await row) ?? missing();
  return {
    day: (dayId: number) => found(resolveDay(tripId, dayId)),
    event: (eventId: number) => found(resolveEvent(tripId, eventId)),
    expense: (expenseId: number) => found(resolveExpense(tripId, expenseId)),
    note: (noteId: number) => found(resolveNote(tripId, noteId)),
    packingLine: (lineId: number) => found(resolvePackingLine(tripId, viewerId, lineId)),
    document: (documentId: number) => found(resolveDocument(tripId, viewerId, documentId)),
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
      avatarIcon: userProfile.avatarIcon,
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
      avatarIcon: r.avatarIcon,
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
    throw new Refusal("Only a trip admin can do that.", "forbidden");
  }
}
