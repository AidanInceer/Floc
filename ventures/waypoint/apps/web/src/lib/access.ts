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
import { trip, tripMembership, user, userProfile } from "@/db/schema";
import { auth } from "@/lib/auth";
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
};

/**
 * The only sanctioned way to load a trip in a page or action. Non-members get
 * `notFound()` — identical to a trip that does not exist.
 *
 * Wrapped in React's `cache()`, and that is not an optimisation detail to be
 * dropped later: *every* trip route calls this twice per navigation — once in
 * `trip/[id]/layout.tsx` for the header and tabs, once in the tab's own page
 * for its data — and without deduping that is three redundant round trips
 * (membership, trip row, member list) on each tab click. Safe to cache because
 * it is per-request and keyed on the same session `getSession` already
 * memoises.
 */
export const requireTripAccess = cache(async function requireTripAccess(
  tripId: number | string,
  redirectTo?: string,
): Promise<TripAccess> {
  const id = Number(tripId);
  const viewer = await requireUser(redirectTo);
  if (!Number.isInteger(id)) notFound();

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
          eq(tripMembership.userId, viewer.id),
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
  };
});

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
