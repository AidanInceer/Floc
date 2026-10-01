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

import { PRESET_TRIPS } from "@floc/core/trip/explore/preset-trips";
import { readTripMark } from "@floc/core/trip/mark/trip-mark";
import { parseTagNames } from "@floc/core/trip/tags";
import { readTripColor } from "@floc/core/trip/trip-color";

import { assertAdmin, findTripAccess, type TripAccess } from "@/server/access";
import { scoped } from "@/server/api-port/api-port-scope";
// The account, map and saved-list halves live in their own files — this one is
// the trip half, and a file whose name needs "and" is two files.
import { billingPort } from "@/server/api-port/api-port-billing";
import { commentsPort } from "@/server/api-port/api-port-comments";
import { pagesPort } from "@/server/api-port/pages/api-port-pages";
import { ideasPort } from "@/server/api-port/ideas/ideas";
import { filesPort } from "@/server/api-port/api-port-files";
import { explorePort } from "@/server/api-port/api-port-explore";
import { kitsPort } from "@/server/api-port/api-port-kits";
import { mapPort } from "@/server/api-port/api-port-map";
import { settingsPort } from "@/server/api-port/api-port-settings";
import { socialPort } from "@/server/api-port/api-port-social";
import { weatherPort } from "@/server/api-port/api-port-weather";
import { calendarPort } from "@/server/api-port/api-port-calendar";
import { notificationsPort } from "@/server/api-port/notifications/notifications";
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
import { listExpenses, listSettlements, listSplits } from "@/server/money/money";
import { recordTransfers, removeExpense, saveExpense } from "@/server/money/money-save";
import { listAvailability, setAvailability } from "@/server/itinerary/availability";
import { listDocuments } from "@/server/documents/documents";
import { bulletPage } from "@floc/core/notes/pages/page-blocks";
import { listTripPlaces, searchPlaces as geocode } from "@/server/itinerary/places";
import { applyOvernight } from "@/server/itinerary/overnight";
import {
  ensureProfile,
  loadIdentity,
  updateProfileFields,
} from "@/server/auth/profile";
import { getPackTier, listPackingClaims, listPackingLines, listPersonalPackingLines } from "@/server/packing/packing";
import {
  addLine,
  applyKit,
  fillBag,
  removeLine,
  removeLines,
  renameLine,
  resetList,
  setClaim,
  setPacked,
  setTier,
  stepQuantity,
} from "@/server/packing/packing-save";
import { insertPackingKit, insertPackingKitItem, listPackingKits, softDeletePackingKit } from "@/server/packing/packing-kits";
import { canUseFeature } from "@/server/billing/entitlements";
import { resolvePackTier } from "@floc/core/packing/packing";
import { readVibeTags } from "@floc/core/trip/vibe-tags";
import { pastTripsFor } from "@/server/auth/visibility";
import { travelMapFor } from "@/server/itinerary/travel-map";
import { leaveTripAs, removeMembership, setMemberRoleAdmin } from "@/server/trips/roster";
import {
  createTripWithAdmin,
  listTripsFor,
  resetInviteToken,
  setTripArchived,
  setTripMuted,
  setTripStarred,
  softDeleteTrip,
  updateTrip,
} from "@/server/trips/trips";

function toDetail(access: TripAccess, bookingPrefill: boolean): TripDetail {
  return {
    bookingPrefill,
    id: access.trip.id,
    name: access.trip.name,
    startDate: access.trip.startDate,
    endDate: access.trip.endDate,
    tags: access.trip.tags,
    colorKey: access.trip.colorKey,
    mark: access.trip.mark,
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
  ...pagesPort,
  ...ideasPort,
  ...socialPort,
  ...billingPort,
  ...weatherPort,
  ...calendarPort,
  ...notificationsPort,
  ...explorePort,

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
    const refusal = await addLine(await scoped(viewerId, tripId), input);
    if (refusal) throw refusal;
  },

  async claimPackingLine(viewerId, tripId, lineId, claimed) {
    await setClaim(await scoped(viewerId, tripId), lineId, claimed);
  },

  async setPackingPacked(viewerId, tripId, lineId, packed) {
    await setPacked(await scoped(viewerId, tripId), lineId, packed);
  },

  async stepPackingQuantity(viewerId, tripId, lineId, delta) {
    await stepQuantity(await scoped(viewerId, tripId), lineId, delta);
  },

  async removePackingLine(viewerId, tripId, lineId) {
    await removeLine(await scoped(viewerId, tripId), lineId);
  },

  async renamePackingLine(viewerId, tripId, lineId, label) {
    const refusal = await renameLine(await scoped(viewerId, tripId), lineId, label);
    if (refusal) throw refusal;
  },

  async removePackingLines(viewerId, tripId, lineIds) {
    await removeLines(await scoped(viewerId, tripId), lineIds);
  },

  async resetPackingList(viewerId, tripId, mine) {
    await resetList(await scoped(viewerId, tripId), mine);
  },

  async setPackTier(viewerId, tripId, tier) {
    await setTier(await scoped(viewerId, tripId), tier);
  },

  async fillMyBag(viewerId, tripId) {
    await fillBag(await scoped(viewerId, tripId));
  },

  async applyPackingKit(viewerId, tripId, kitId) {
    await applyKit(await scoped(viewerId, tripId), kitId);
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

  async setTripMuted(viewerId, tripId, muted) {
    await scoped(viewerId, tripId);
    await setTripMuted(tripId, viewerId, muted);
    refresh({ kind: "tripList" });
  },

  async loadTrip(viewerId, tripId): Promise<TripDetail | null> {
    const access = await findTripAccess(tripId, viewerId);
    return access ? toDetail(access, await canUseFeature("booking.prefill", tripId)) : null;
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
        clearsAmountMinor: s.clearsAmountMinor,
        clearsCurrency: s.clearsCurrency,
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
      dayId: d.dayId,
      eventDayId: d.eventDayId,
    }));
  },

  async listPlaces(viewerId, tripId): Promise<TripPlace[]> {
    await scoped(viewerId, tripId);
    return listTripPlaces(tripId);
  },

  // No trip to scope to: the picker searches before one is chosen. Signed in
  // is the whole gate, and the procedure has already insisted on that.
  searchPlaces(viewerId, query): Promise<PlaceHit[]> {
    return geocode(query, viewerId);
  },

  async setOvernight(viewerId, tripId, input) {
    await scoped(viewerId, tripId);
    if (await applyOvernight(tripId, input.startDate, input.endDate, input.place)) {
      refresh({ kind: "itinerary", tripId });
    }
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
      firstPage: bulletPage(preset.highlights),
    });
    refresh({ kind: "tripList" });
    return { id };
  },

  async updateTrip(viewerId, tripId, patch: TripPatch) {
    await scoped(viewerId, tripId);
    // `tags: null` clears on the wire, but the column's patch type says
    // `string[]`, so an explicit clear becomes an empty list.
    const { tags, startDate, endDate, colorKey, mark, ...rest } = patch;
    await updateTrip(tripId, {
      ...rest,
      ...(colorKey !== undefined ? { colorKey: readTripColor(colorKey) } : {}),
      ...(mark !== undefined ? { mark: readTripMark(mark) } : {}),
      ...(tags !== undefined ? { tags: parseTagNames(tags ?? []) } : {}),
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

  async resetInviteLink(viewerId, tripId) {
    assertAdmin(await scoped(viewerId, tripId));
    const minted = await resetInviteToken(tripId);
    refresh({ kind: "tripOverview", tripId });
    return minted;
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
    const refusal = await saveExpense(await scoped(viewerId, tripId), input);
    if (refusal) throw refusal;
  },

  async settleUp(viewerId, tripId, transfers) {
    const refusal = await recordTransfers(await scoped(viewerId, tripId), transfers);
    if (refusal) throw refusal;
  },

  async deleteExpense(viewerId, tripId, expenseId) {
    await removeExpense(await scoped(viewerId, tripId), expenseId);
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
