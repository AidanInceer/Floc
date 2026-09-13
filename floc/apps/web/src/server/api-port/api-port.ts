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
  MyProfile,
  PackingBoard,
  ItineraryDay,
  Ledger,
  NewTrip,
  TripDetail,
  TripFile,
  TripPatch,
  TripPlace,
  PlaceHit,
} from "@floc/api/port";

import { PRESET_TRIPS } from "@floc/core/trip/preset-trips";

import { assertAdmin, findTripAccess, type TripAccess } from "@/server/access";
import { scoped } from "@/server/api-port/api-port-scope";
// The account, map and saved-list halves live in their own files — this one is
// the trip half, and a file whose name needs "and" is two files.
import { billingPort } from "@/server/api-port/api-port-billing";
import { commentsPort } from "@/server/api-port/api-port-comments";
import { filesPort } from "@/server/api-port/api-port-files";
import { kitsPort } from "@/server/api-port/api-port-kits";
import { mapPort } from "@/server/api-port/api-port-map";
import { settingsPort } from "@/server/api-port/api-port-settings";
import { socialPort } from "@/server/api-port/api-port-social";
import { weatherPort } from "@/server/api-port/api-port-weather";
import { calendarPort } from "@/server/api-port/api-port-calendar";
import { notificationsPort } from "@/server/api-port/api-port-notifications";
import { refresh } from "@/server/freshness";
import { emailConfigured } from "@/server/auth/email";
import { findTripByInviteToken, joinWithLink } from "@/server/trips/invites";
import {
  insertEvent,
  listDaysWithEvents,
  setTripWindow,
  softDeleteEvent,
  updateEventFields,
} from "@/server/itinerary/itinerary";
import {
  findLiveExpense,
  listExpenses,
  listSettlements,
  listSplits,
  softDeleteExpense,
  writeExpense,
  writeSettlements,
} from "@/server/money/money";
import { listAvailability, setAvailability } from "@/server/itinerary/availability";
import { listDocuments } from "@/server/documents/documents";
import { bulletDoc, loadNoteDoc, saveNoteDoc } from "@/server/notes/note-doc";
import { listTripPlaces, searchPlaces as geocode } from "@/server/itinerary/places";
import { applyOvernight } from "@/server/itinerary/overnight";
import {
  ensureProfile,
  loadIdentity,
  updateProfileFields,
} from "@/server/auth/profile";
import {
  claimPackingLine,
  insertPackingLine,
  insertPersonalPackingLine,
  listPackingClaims,
  listPackingLines,
  listPersonalPackingLines,
  getPackTier,
  setPackTier,
  softDeletePackingLines,
  softDeleteWholeList,
  setClaimPacked,
  setPersonalPacked,
  softDeletePackingLine,
  stepPersonalQuantity,
  unclaimPackingLine,
} from "@/server/packing/packing";
import {
  listPackingKits,
  applyPackingKitToBag,
  insertPackingKit,
  insertPackingKitItem,
  softDeletePackingKit,
} from "@/server/packing/packing-kits";
import { fillPersonalBag, packingPlanFor } from "@/server/packing/packing-generator";
import { canUseFeature, assertFeature } from "@/server/billing/entitlements";
import { resolvePackTier } from "@floc/core/packing/packing";
import { readVibeTags } from "@floc/core/trip/vibe-tags";
import { pastTripsFor } from "@/server/auth/visibility";
import { travelMapFor } from "@/server/itinerary/travel-map";
import { leaveTripAs, removeMembership, setMemberRoleAdmin } from "@/server/trips/roster";
import {
  createTripWithAdmin,
  listTripsFor,
  setTripArchived,
  setTripStarred,
  softDeleteTrip,
  updateTrip,
} from "@/server/trips/trips";

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
      avatarIcon: m.avatarIcon,
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
  ...settingsPort,
  ...mapPort,
  ...kitsPort,
  ...filesPort,
  ...commentsPort,
  ...socialPort,
  ...billingPort,
  ...weatherPort,
  ...calendarPort,
  ...notificationsPort,

  async loadPacking(viewerId, tripId): Promise<PackingBoard> {
    await scoped(viewerId, tripId);
    const [shared, claims, mine, perTrip, profile, kits, canAutoFill] = await Promise.all([
      listPackingLines(tripId),
      listPackingClaims(tripId),
      listPersonalPackingLines(tripId, viewerId),
      getPackTier(tripId, viewerId),
      ensureProfile(viewerId),
      listPackingKits(viewerId),
      canUseFeature("packing.autoGenerate", tripId),
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
      // Resolved here rather than on the wire: the per-trip choice wins and the
      // profile fills in, and a client that had to know that rule would be a
      // second place it could be got wrong (ticket 220).
      tier: resolvePackTier(perTrip, profile.packTier),
      kits: kits.map((kit) => ({ id: kit.id, name: kit.name, itemCount: kit.itemCount })),
      canAutoFill,
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

  async stepPackingQuantity(viewerId, tripId, lineId, delta) {
    const access = await scoped(viewerId, tripId);
    // `packingLine` resolves a personal line only for its owner, so a bag that
    // is not yours does not exist to this call.
    const line = await access.packingLine(lineId);
    await stepPersonalQuantity(line.id, viewerId, delta);
    refresh({ kind: "packing", tripId });
  },

  async removePackingLine(viewerId, tripId, lineId) {
    const access = await scoped(viewerId, tripId);
    // A shared line is anyone's to drop — the list is the group's, and one
    // nobody wants should not outlive whoever typed it. A personal one only
    // ever resolves for its owner, so this is already scoped.
    const line = await access.packingLine(lineId);
    await softDeletePackingLine(line.id, viewerId);
    refresh({ kind: "packing", tripId });
  },

  async removePackingLines(viewerId, tripId, lineIds) {
    const access = await scoped(viewerId, tripId);
    // One resolve per id, not a filtered `IN`: the bulk shape is a convenience
    // for the person, never a way round the per-line check (#229). A set
    // holding somebody else's personal line throws whole.
    const lines = await Promise.all(lineIds.map((id) => access.packingLine(id)));
    await softDeletePackingLines(lines.map((line) => line.id), viewerId);
    refresh({ kind: "packing", tripId });
  },

  async resetPackingList(viewerId, tripId, mine) {
    await scoped(viewerId, tripId);
    // The scope is decided here and applied in the SQL, so "clear my bag"
    // cannot be spelled as "clear someone else's".
    await softDeleteWholeList(tripId, mine ? viewerId : null, viewerId);
    refresh({ kind: "packing", tripId });
  },

  async setPackTier(viewerId, tripId, tier) {
    await scoped(viewerId, tripId);
    // The membership row, not the profile — Light for one weekend must not
    // become the default everywhere (#220).
    await setPackTier(tripId, viewerId, tier);
    refresh({ kind: "packing", tripId });
  },

  async fillMyBag(viewerId, tripId) {
    const access = await scoped(viewerId, tripId);
    // Pro buys the action, never the data (#248): a bag already filled stays
    // readable and editable after Pro lapses.
    await assertFeature("packing.autoGenerate", tripId);

    const [perTrip, profile] = await Promise.all([
      getPackTier(tripId, viewerId),
      ensureProfile(viewerId),
    ]);
    // Re-resolved rather than trusted from the client: the screen that drew the
    // button may be a stale tab.
    await fillPersonalBag({
      tripId,
      ownerId: viewerId,
      tier: resolvePackTier(perTrip, profile.packTier),
      plan: await packingPlanFor(access.trip),
    });
    refresh({ kind: "packing", tripId });
  },

  async applyPackingKit(viewerId, tripId, kitId) {
    await scoped(viewerId, tripId);
    // Resolved by owner inside, so another account's kit is not addressable.
    await applyPackingKitToBag({ tripId, ownerId: viewerId, kitId });
    refresh({ kind: "packing", tripId });
  },

  async savePackingKit(viewerId, tripId, name): Promise<boolean> {
    await scoped(viewerId, tripId);
    const lines = await listPersonalPackingLines(tripId, viewerId);
    const kitId = await insertPackingKit(viewerId, name);
    // Null is the ceiling, not a failure — the caller says so and nothing throws.
    if (kitId === null) return false;
    // One at a time because the item insert re-reads the kit to check its own
    // cap; a bag past `LIMITS.packingKitItems` fills the kit and stops there.
    for (const line of lines) {
      await insertPackingKitItem(kitId, viewerId, line.label, line.category, line.quantity);
    }
    refresh({ kind: "packing", tripId });
    return true;
  },

  async deletePackingKit(viewerId, kitId) {
    // No trip scope: a kit is the viewer's own row, resolved by owner inside.
    await softDeletePackingKit(kitId, viewerId);
  },

  async loadMyProfile(viewerId): Promise<MyProfile> {
    const profile = await ensureProfile(viewerId);
    const [map, pastTrips] = await Promise.all([
      travelMapFor(viewerId),
      pastTripsFor(viewerId, profile.pastTripsShow),
    ]);

    return {
      vibeTags: readVibeTags(profile.vibeTags),
      // Codes and states only — both clients hold `@floc/core/countries`, so
      // sending the names would be sending what the reader already has.
      map: Object.entries(map.states).map(([code, state]) => ({ code, state })),
      been: map.visited,
      wantToGo: map.wantToGo,
      // `place` is dropped: the phone's list is a name and a date range, and a
      // field nothing draws is a field that goes stale unnoticed.
      pastTrips: pastTrips.map((trip) => ({
        id: trip.id,
        name: trip.name,
        startDate: trip.startDate,
        endDate: trip.endDate,
      })),
    };
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
      canConfirmEmail: emailConfigured(),
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

  async setTripStarred(viewerId, tripId, starred) {
    await scoped(viewerId, tripId);
    await setTripStarred(tripId, viewerId, starred);
    refresh({ kind: "tripList" });
  },

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
      dayEventId: d.dayEventId,
      eventTitle: d.eventTitle,
    }));
  },

  async listPlaces(viewerId, tripId): Promise<TripPlace[]> {
    await scoped(viewerId, tripId);
    return listTripPlaces(tripId);
  },

  // No trip to scope to: the picker searches before one is chosen. Signed in
  // is the whole gate, and the procedure has already insisted on that.
  searchPlaces(_viewerId, query): Promise<PlaceHit[]> {
    return geocode(query);
  },

  async setOvernight(viewerId, tripId, input) {
    await scoped(viewerId, tripId);
    if (await applyOvernight(tripId, input.startDate, input.endDate, input.place)) {
      refresh({ kind: "itinerary", tripId });
    }
  },

  async loadNotes(viewerId, tripId): Promise<string | null> {
    await scoped(viewerId, tripId);
    return loadNoteDoc(tripId);
  },

  async saveNotes(viewerId, tripId, body) {
    await scoped(viewerId, tripId);
    // No role check: writing in the trip's notebook is not one of the three
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
    const { tags, startDate, endDate, ...rest } = patch;
    await updateTrip(tripId, {
      ...rest,
      ...(tags !== undefined ? { tags: tags ?? [] } : {}),
    });
    // Why: dates go through the same window write as the web's Dates tab, so
    // the days follow (ticket 140) and the group hears about it (#344).
    if (startDate !== undefined || endDate !== undefined) {
      const current = await scoped(viewerId, tripId);
      await setTripWindow(
        tripId,
        startDate === undefined ? current.trip.startDate : startDate,
        endDate === undefined ? current.trip.endDate : endDate,
        viewerId,
      );
    }
    refresh({ kind: "tripHeader", tripId }, { kind: "tripList" });
  },

  async archiveTrip(viewerId, tripId, archived) {
    assertAdmin(await scoped(viewerId, tripId));
    await setTripArchived(tripId, archived);
    refresh({ kind: "tripList" });
  },

  async deleteTrip(viewerId, tripId) {
    assertAdmin(await scoped(viewerId, tripId));
    await softDeleteTrip(tripId);
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
    await removeMembership(tripId, userId, viewerId);
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

  async settleUp(viewerId, tripId, transfers) {
    const access = await scoped(viewerId, tripId);
    // Both ends must be on this trip. Without the check, a crafted id would
    // write a debt against somebody who is not in the group at all.
    const onTrip = new Set(access.members.map((member) => member.userId));
    if (transfers.some((t) => !onTrip.has(t.fromUserId) || !onTrip.has(t.toUserId))) {
      throw new Error("That person is not on this trip.");
    }
    await writeSettlements(tripId, viewerId, transfers);
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
