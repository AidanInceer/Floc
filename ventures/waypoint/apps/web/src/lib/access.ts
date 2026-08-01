/**
 * Session and trip-membership gating (ticket 05).
 *
 * Two rules that must not drift:
 *  - Unauthenticated hit on any trip route → redirect to /login?redirect=...
 *    revealing nothing about the trip.
 *  - Authenticated non-member → the *same* generic no-access response whether
 *    the trip id is real or fake, so ids cannot be enumerated.
 */
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
  trip,
  tripMembership,
  user,
  userProfile,
} from "@/db/schema";
import { auth } from "@/lib/auth";
import { dietarySummary, readDietFlags } from "@/lib/dietary";
import { seatTone } from "@/lib/who";
import type { TripRole } from "@/db/schema";

export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

/** Current user or a redirect to login carrying where they were headed. */
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
   *
   * `requireTripAccess` used to answer one question — "may this viewer touch
   * trip 12?" — and then step aside. But almost every action operates on a
   * *child* of the trip whose id arrives from the client, and binding that
   * child back to the trip was left to the caller as an unwritten obligation
   * across ~70 call sites. Six callers forgot, which is ticket 104.
   *
   * That made the interface shallow: the obligation it left behind was larger
   * than the answer it gave. These resolvers move the join inside, so the
   * unsafe form stops being expressible — an action that wants an event calls
   * `access.event(id)` and there is no shorter way to get one.
   *
   * Each returns the full row, or `notFound()` — the same response as a row
   * that does not exist, so child ids stay non-enumerable (rule 5). Each also
   * filters `deletedAt` (rule 8).
   */
  day: (dayId: number) => Promise<typeof day.$inferSelect>;
  event: (eventId: number) => Promise<typeof dayEvent.$inferSelect>;
  idea: (ideaId: number) => Promise<typeof idea.$inferSelect>;
  expense: (expenseId: number) => Promise<typeof expense.$inferSelect>;
  note: (noteId: number) => Promise<typeof note.$inferSelect>;
};

export type TripMember = {
  userId: string;
  role: TripRole;
  name: string;
  email: string;
  avatarUrl: string | null;
  joinedAt: Date;
  /**
   * The member's avatar colour, as a `who-*` class (ticket 11). Assigned here,
   * from their position in this trip's roster, so no two members of a trip
   * share a pastel and each keeps the same one on every tab. Anything drawing
   * a member's avatar should pass this through rather than let `Avatar` fall
   * back to hashing the name — that's for people with no roster behind them.
   */
  tone: string;
  /**
   * Their dietary line, or null if they haven't shared it (ticket 46). Dietary
   * is a *functional* attribute: it never appears on a profile page, it appears
   * here, where a group deciding where to eat actually needs it.
   */
  dietary: string | null;
};

/**
 * The trip read itself, keyed on exactly the two things it depends on: which
 * trip, and who is asking.
 *
 * Keeping `redirectTo` OUT of this signature is the whole point. `cache()`
 * keys on every argument, so while this lived on `requireTripAccess` — which
 * takes the login-redirect path — the layout's call (`…/overview`) and the
 * page's call (`…/days`) were different keys and deduped only on the Overview
 * tab. Every other tab silently ran the membership and trip lookups twice per
 * navigation. The redirect path is a property of the *caller*, not of the data,
 * so it stays outside the memo.
 */
const loadTripAccess = cache(async function loadTripAccess(
  id: number,
  viewerId: string,
) {
  // Membership, the trip row and the roster are three independent lookups, so
  // all three go out at once. The membership check still gates the response —
  // it just no longer makes the other two wait their turn, and the roster in
  // particular was costing a third serial round trip on every trip request
  // for data every trip page needs anyway.
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
 * `notFound()` — identical to a trip that does not exist.
 *
 * *Every* trip route resolves this twice per navigation — once in
 * `trip/[id]/layout.tsx` for the header and tabs, once in the tab's own page
 * for its data. The dedupe lives in `loadTripAccess` above; see the note there
 * for why it cannot move back onto this function.
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
 * The resolvers on `TripAccess`, built for one trip id. See the doc on the type
 * for why they exist at all.
 *
 * Each is memoised with `cache()`, keyed on the trip and the child id — several
 * actions resolve the same row more than once (an update reads it, then the
 * revalidation path wants its day), and per-request dedupe makes that free. The
 * key discipline from `loadTripAccess` holds here too: nothing that belongs to
 * the *caller* rather than to the data goes into the key.
 *
 * `day` and `idea` and `expense` and `note` reach `trip` by a direct column;
 * `event` reaches it through its day, which is the whole shape of the bug
 * ticket 104 fixed by hand.
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

/**
 * `note` is polymorphic (`scope` + `scope_id`) but still carries its own
 * `trip_id`, so it binds to the trip directly like the others. What this
 * resolver deliberately does *not* check is that the note's `scope_id` points
 * at something in the same trip — that's a second invariant, and it belongs to
 * whoever writes the scope, not to whoever reads the note.
 */
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
    // Earliest-joined first — the order sole-admin promotion also uses
    // (ticket 06). Tie-broken on user id so a group seeded within the same
    // second still renders in a stable order.
    .sort(
      (a, b) =>
        a.joinedAt.getTime() - b.joinedAt.getTime() ||
        a.userId.localeCompare(b.userId),
    )
    // Colour assigned after sorting, so it follows join order and a member's
    // pastel doesn't shift when somebody else joins later.
    .map((m, seat) => ({ ...m, tone: seatTone(seat) }));
}

export const listMembers = cache(async function listMembers(
  tripId: number,
): Promise<TripMember[]> {
  const rows = await memberQuery()
    .where(
      and(eq(tripMembership.tripId, tripId), isNull(tripMembership.deletedAt)),
    )
    .all();

  return toRoster(rows);
});

/**
 * Rosters for several trips in one query.
 *
 * The trip-list pages draw an avatar row per card, and calling `listMembers`
 * per card is an N+1 — parallel, but still one round trip per trip. Grouping
 * in JS keeps the per-trip seat colours identical to the single-trip loader,
 * because `toRoster` runs per trip either way.
 */
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

/**
 * Admin-only powers (ticket 01 step 7): invite, kick, promote, archive/restore
 * and delete. Nothing else differs between admin and member.
 */
export function assertAdmin(access: TripAccess): void {
  if (!access.isAdmin) {
    throw new Error("Only a trip admin can do that");
  }
}
