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
  Availability,
  EventInput,
  ExpenseInput,
  FlocPort,
  Me,
  PackingBoard,
  ItineraryDay,
  Ledger,
  NewTrip,
  TripDetail,
  TripFile,
  TripPatch,
  TripPlace,
} from "@floc/api/port";

import { PRESET_TRIPS } from "@floc/core/preset-trips";

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
  writeSettlement,
} from "@/server/money";
import { listAvailability, setAvailability } from "@/server/availability";
import { listDocuments } from "@/server/documents";
import { bulletDoc, loadNoteDoc, saveNoteDoc } from "@/server/note-doc";
import { listTripPlaces } from "@/server/places";
import {
  ensureProfile,
  loadIdentity,
  updateProfileFields,
} from "@/server/profile";
import {
  claimPackingLine,
  insertPackingLine,
  insertPersonalPackingLine,
  listPackingClaims,
  listPackingLines,
  listPersonalPackingLines,
  setClaimPacked,
  setPersonalPacked,
  softDeletePackingLine,
  unclaimPackingLine,
} from "@/server/packing";
import { travelMapFor } from "@/server/travel-map";
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
  async loadPacking(viewerId, tripId): Promise<PackingBoard> {
    await scoped(viewerId, tripId);
    const [shared, claims, mine] = await Promise.all([
      listPackingLines(tripId),
      listPackingClaims(tripId),
      listPersonalPackingLines(tripId, viewerId),
    ]);

    // Claims come back flat for one query rather than one per line; grouping
    // here keeps the wire shape the screen actually draws.
    const byLine = new Map<number, PackingBoard["shared"][number]["claims"]>();
    for (const claim of claims) {
      const list = byLine.get(claim.packingLineId) ?? [];
      list.push({ userId: claim.userId, name: claim.name, packed: claim.packedAt !== null });
      byLine.set(claim.packingLineId, list);
    }

    return {
      shared: shared.map((line) => ({
        id: line.id,
        label: line.label,
        category: line.category,
        claims: byLine.get(line.id) ?? [],
      })),
      mine: mine.map((line) => ({
        id: line.id,
        label: line.label,
        category: line.category,
        quantity: line.quantity,
        packed: line.packedAt !== null,
      })),
    };
  },

  async addPackingLine(viewerId, tripId, input) {
    await scoped(viewerId, tripId);
    // Author and owner are the same person by construction on a personal line
    // — there is no way to add to somebody else's bag from here (#220).
    if (input.mine) await insertPersonalPackingLine(tripId, viewerId, input.label, input.category);
    else await insertPackingLine(tripId, viewerId, input.label, input.category);
    refresh({ kind: "packing", tripId });
  },

  async claimPackingLine(viewerId, tripId, lineId, claimed) {
    const access = await scoped(viewerId, tripId);
    // Resolved through the same resolver the web action uses: a line on
    // another trip, or somebody else's personal line, never resolves at all.
    const line = await access.packingLine(lineId);
    if (claimed) await claimPackingLine(line.id, viewerId);
    else await unclaimPackingLine(line.id, viewerId);
    refresh({ kind: "packing", tripId });
  },

  async setPackingPacked(viewerId, tripId, lineId, packed) {
    const access = await scoped(viewerId, tripId);
    const line = await access.packingLine(lineId);
    // Which list it is on decides which row carries the tick: a shared line's
    // tick belongs to your claim, a personal line's to the line itself.
    if (line.ownerId === null) await setClaimPacked(line.id, viewerId, packed);
    else await setPersonalPacked(line.id, viewerId, packed);
    refresh({ kind: "packing", tripId });
  },

  async removePackingLine(viewerId, tripId, lineId) {
    const access = await scoped(viewerId, tripId);
    // A shared line is anyone's to drop — the list is the group's, and one
    // nobody wants should not outlive whoever typed it. A personal one only
    // ever resolves for its owner, so this is already scoped.
    const line = await access.packingLine(lineId);
    await softDeletePackingLine(line.id);
    refresh({ kind: "packing", tripId });
  },

  async loadMe(viewerId): Promise<Me> {
    // The lazy profile row first, so a person who has never opened settings
    // still reads back a profile rather than a hole.
    await ensureProfile(viewerId);
    const [identity, map, trips] = await Promise.all([
      loadIdentity(viewerId),
      travelMapFor(viewerId),
      listTripsFor(viewerId, { archived: false }),
    ]);
    // The session proved this id a moment ago; a missing row here is the
    // account being deleted mid-request, not an ordinary state.
    if (!identity) throw new Error("No such account.");

    return {
      ...identity,
      been: map.visited,
      wantToGo: map.wantToGo,
      tripCount: trips.length,
    };
  },

  async renameMe(viewerId, displayName) {
    await ensureProfile(viewerId);
    await updateProfileFields(viewerId, { displayName });
    // The name rides on every roster and every expense line, so every page
    // showing this person is now stale.
    refresh({ kind: "tripList" });
  },

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

  async listAvailability(viewerId, tripId): Promise<Availability[]> {
    await scoped(viewerId, tripId);
    return listAvailability(tripId);
  },

  async setAvailability(viewerId, tripId, dates, available) {
    await scoped(viewerId, tripId);
    // The viewer id goes straight down as the row's owner, so there is no path
    // by which this writes somebody else's answer (rule 6).
    await setAvailability(tripId, viewerId, dates, available);
    refresh({ kind: "tripDates", tripId });
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

  async loadNotes(viewerId, tripId): Promise<string | null> {
    await scoped(viewerId, tripId);
    return loadNoteDoc(tripId);
  },

  async saveNotes(viewerId, tripId, body) {
    await scoped(viewerId, tripId);
    // No role check: writing in the trip's notebook is not one of the four
    // admin powers (rule 6). Last write wins (rule 7), as on the web page.
    await saveNoteDoc(tripId, viewerId, body);
    // No revalidate, matching the web action: the editor already holds what it
    // just sent, and re-rendering under it would fight the caret.
  },

  async createTrip(viewerId, input: NewTrip) {
    // The lazy profile row, as the web action does — a trip whose creator has
    // no profile renders a nameless admin on every roster.
    await ensureProfile(viewerId);
    const id = await createTripWithAdmin({ ...input, createdBy: viewerId });
    refresh({ kind: "tripList" });
    return { id };
  },

  async startTripFromPreset(viewerId, presetId) {
    const preset = PRESET_TRIPS.find((listing) => listing.id === presetId);
    // A listing can be retired between drawing and tapping — null, not a throw.
    if (!preset) return null;

    await ensureProfile(viewerId);
    const id = await createTripWithAdmin({
      name: preset.title,
      // `bestMonths` is deliberately not applied: dates come from the group's
      // own availability overlap, and an undated trip is never wrong (rule 9).
      startDate: null,
      endDate: null,
      createdBy: viewerId,
    });
    if (preset.highlights.length > 0) {
      await saveNoteDoc(id, viewerId, bulletDoc(preset.highlights));
    }
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

  async settleUp(viewerId, tripId, input) {
    const access = await scoped(viewerId, tripId);
    // Both ends must be on this trip. Without the check, a crafted id would
    // write a debt against somebody who is not in the group at all.
    const onTrip = new Set(access.members.map((member) => member.userId));
    if (!onTrip.has(input.fromUserId) || !onTrip.has(input.toUserId)) {
      throw new Error("That person is not on this trip.");
    }
    await writeSettlement({ tripId, createdBy: viewerId, ...input });
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
