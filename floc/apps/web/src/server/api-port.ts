/**
 * The web app's implementation of the API's port (ticket 287).
 *
 * This is the whole seam. `@floc/api` declares what the API *is*; this says
 * how it reaches data — and it does so through exactly the same `server/`
 * modules the pages and Server Actions already use. Nothing is reimplemented
 * for the phone, which is the point: a rule with two implementations is a rule
 * with two behaviours, and the phone would be the one to quietly drift.
 *
 * ACCESS IS RESOLVED ON EVERY CALL, never taken from the caller's word for it.
 * `scoped()` runs `findTripAccess`, which is `requireTripAccess` without the
 * redirect — non-member and nonexistent answer identically (rule 5). Admin
 * powers go through the same `assertAdmin` the actions use (rule 6).
 */
import "server-only";

import type {
  EventInput,
  ExpenseInput,
  FlocPort,
  ItineraryDay,
  Ledger,
  NewTrip,
  TripDetail,
  TripFile,
  TripPatch,
  TripPlace,
} from "@floc/api/port";

import { assertAdmin, findTripAccess, type TripAccess } from "@/server/access";
import { refresh } from "@/server/freshness";
import { findTripByInviteToken, joinWithLink } from "@/server/invites";
import {
  insertEvent,
  listDaysWithEvents,
  softDeleteEvent,
  updateEventFields,
} from "@/server/itinerary";
import {
  findLiveExpense,
  listExpenses,
  listSettlements,
  listSplits,
  softDeleteExpense,
  writeExpense,
} from "@/server/money";
import { listDocuments } from "@/server/documents";
import { listTripPlaces } from "@/server/places";
import { ensureProfile } from "@/server/profile";
import { leaveTripAs, removeMembership, setMemberRoleAdmin } from "@/server/roster";
import {
  createTripWithAdmin,
  listTripsFor,
  setTripArchived,
  updateTrip,
} from "@/server/trips";

/** Every trip-scoped method starts here. Refusing is a thrown error, not a redirect — a route handler cannot catch `notFound()`. */
async function scoped(viewerId: string, tripId: number): Promise<TripAccess> {
  const access = await findTripAccess(tripId, viewerId);
  // The router already resolved the trip once through `loadTrip`, so this only
  // fires on a race — somebody kicked between the two reads. `cache()` makes
  // the repeat read free within a request.
  if (!access) throw new Error("No such trip.");
  return access;
}

function toDetail(access: TripAccess): TripDetail {
  return {
    id: access.trip.id,
    name: access.trip.name,
    startDate: access.trip.startDate,
    endDate: access.trip.endDate,
    tags: access.trip.tags,
    colorKey: access.trip.colorKey,
    archived: access.trip.archivedAt !== null,
    role: access.role,
    members: access.members.map((m) => ({
      userId: m.userId,
      role: m.role,
      name: m.name,
      email: m.email,
      avatarUrl: m.avatarUrl,
      tone: m.tone,
      dietary: m.dietary,
    })),
  };
}

/** `EventFields` and the wire's `EventInput` differ only in what is optional, so this is a widening. */
function toEventFields(input: EventInput) {
  return {
    type: input.type,
    title: input.title,
    transportType: input.transportType,
    time: input.time,
    endTime: input.endTime,
    allDay: input.allDay,
    note: input.note,
  };
}

export const webPort: FlocPort = {
  listTrips: (viewerId, options) => listTripsFor(viewerId, options),

  async loadTrip(viewerId, tripId): Promise<TripDetail | null> {
    const access = await findTripAccess(tripId, viewerId);
    return access ? toDetail(access) : null;
  },

  async listDays(viewerId, tripId): Promise<ItineraryDay[]> {
    await scoped(viewerId, tripId);
    return listDaysWithEvents(tripId);
  },

  async loadLedger(viewerId, tripId): Promise<Ledger> {
    await scoped(viewerId, tripId);
    const [expenses, splits, settlements] = await Promise.all([
      listExpenses(tripId),
      listSplits(tripId),
      listSettlements(tripId),
    ]);
    return {
      expenses: expenses.map((e) => ({
        id: e.id,
        description: e.description,
        amountMinor: e.amountMinor,
        currency: e.currency,
        category: e.category,
        splitType: e.splitType,
        paidBy: e.paidBy,
        dayId: e.dayId,
        notes: e.notes,
      })),
      splits: splits.map((s) => ({
        expenseId: s.expenseId,
        userId: s.userId,
        owedAmountMinor: s.owedAmountMinor,
      })),
      settlements: settlements.map((s) => ({
        id: s.id,
        fromUserId: s.fromUserId,
        toUserId: s.toUserId,
        amountMinor: s.amountMinor,
        currency: s.currency,
      })),
    };
  },

  async listFiles(viewerId, tripId): Promise<TripFile[]> {
    await scoped(viewerId, tripId);
    // The viewer goes down to the query, which drops a private file that is
    // somebody else's rather than returning it flagged.
    const rows = await listDocuments(tripId, viewerId);
    return rows.map((d) => ({
      id: d.id,
      name: d.name,
      mimeType: d.mimeType,
      sizeBytes: d.sizeBytes,
      category: d.category,
      uploadedAt: d.createdAt.toISOString(),
      uploadedBy: d.uploadedBy,
      uploaderName: d.uploaderName,
      ownerId: d.ownerId,
    }));
  },

  async listPlaces(viewerId, tripId): Promise<TripPlace[]> {
    await scoped(viewerId, tripId);
    return listTripPlaces(tripId);
  },

  async createTrip(viewerId, input: NewTrip) {
    // The lazy profile row, as the web action does — a trip whose creator has
    // no profile renders a nameless admin on every roster.
    await ensureProfile(viewerId);
    const id = await createTripWithAdmin({ ...input, createdBy: viewerId });
    refresh({ kind: "tripList" });
    return { id };
  },

  async updateTrip(viewerId, tripId, patch: TripPatch) {
    await scoped(viewerId, tripId);
    // `tags: null` clears on the wire, but the column's patch type says
    // `string[]`, so an explicit clear becomes an empty list.
    const { tags, ...rest } = patch;
    await updateTrip(tripId, {
      ...rest,
      ...(tags !== undefined ? { tags: tags ?? [] } : {}),
    });
    refresh({ kind: "tripHeader", tripId }, { kind: "tripList" });
  },

  async archiveTrip(viewerId, tripId, archived) {
    assertAdmin(await scoped(viewerId, tripId));
    await setTripArchived(tripId, archived);
    refresh({ kind: "tripList" });
  },

  async leaveTrip(viewerId, tripId) {
    const access = await scoped(viewerId, tripId);
    await leaveTripAs({
      tripId,
      userId: viewerId,
      isAdmin: access.isAdmin,
      archivedAt: access.trip.archivedAt,
      others: access.members
        .filter((m) => m.userId !== viewerId)
        .map((m) => ({ userId: m.userId, role: m.role, joinedAt: m.joinedAt })),
    });
    refresh({ kind: "tripList" });
  },

  async removeMember(viewerId, tripId, userId) {
    assertAdmin(await scoped(viewerId, tripId));
    // Kicking yourself is leaving, which is not an admin power — route it there
    // so succession and the last-member archive still run (rule 6).
    if (userId === viewerId) return webPort.leaveTrip(viewerId, tripId);
    await removeMembership(tripId, userId);
    refresh({ kind: "tripHeader", tripId });
  },

  async promoteMember(viewerId, tripId, userId) {
    assertAdmin(await scoped(viewerId, tripId));
    await setMemberRoleAdmin(tripId, userId);
    refresh({ kind: "tripHeader", tripId });
  },

  async joinByToken(viewerId, token) {
    const found = await findTripByInviteToken(token);
    if (!found) return null;
    await ensureProfile(viewerId);
    await joinWithLink(found.id, viewerId);
    refresh({ kind: "tripList" });
    return { id: found.id };
  },

  async writeExpense(viewerId, tripId, input: ExpenseInput & { expenseId?: number }) {
    await scoped(viewerId, tripId);
    // A stale id must not become an insert under a different trip.
    if (input.expenseId !== undefined) {
      const live = await findLiveExpense(tripId, input.expenseId);
      if (!live) throw new Error("That expense is gone.");
    }
    await writeExpense({
      tripId,
      expenseId: input.expenseId,
      createdBy: viewerId,
      fields: {
        dayId: input.dayId,
        paidBy: input.paidBy,
        description: input.description,
        amountMinor: input.amountMinor,
        currency: input.currency,
        splitType: input.splitType,
        category: input.category,
        notes: input.notes,
      },
      splits: input.splits,
    });
    refresh({ kind: "money", tripId });
  },

  async deleteExpense(viewerId, tripId, expenseId) {
    await scoped(viewerId, tripId);
    await softDeleteExpense(tripId, expenseId);
    refresh({ kind: "money", tripId });
  },

  async addEvent(viewerId, tripId, dayId, input) {
    const access = await scoped(viewerId, tripId);
    // Binds the day to this trip — the resolver 404s one belonging to another.
    const day = await access.day(dayId);
    await insertEvent(day.id, toEventFields(input));
    refresh({ kind: "itinerary", tripId });
  },

  async updateEvent(viewerId, tripId, eventId, input) {
    const access = await scoped(viewerId, tripId);
    const event = await access.event(eventId);
    await updateEventFields(event.id, toEventFields(input));
    refresh({ kind: "itinerary", tripId });
  },

  async deleteEvent(viewerId, tripId, eventId) {
    const access = await scoped(viewerId, tripId);
    const event = await access.event(eventId);
    await softDeleteEvent(event.id);
    refresh({ kind: "itinerary", tripId });
  },
};
