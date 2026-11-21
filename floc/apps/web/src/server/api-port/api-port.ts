import "server-only";

import type {
  Availability,
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

import { copyListing } from "@/server/explore/listing-copy";
import { saveTrip, startTrip } from "@/server/trips/trip-save";

import { assertAdmin, findTripAccess, type TripAccess } from "@/server/access";
import { listTripCards } from "@/server/trips/trip-cards";
import { scoped } from "@/server/api-port/api-port-scope";
import { billingPort } from "@/server/api-port/api-port-billing";
import { estimatePort } from "@/server/api-port/estimate/api-port-estimate";
import { commentsPort } from "@/server/api-port/api-port-comments";
import { pagesPort } from "@/server/api-port/pages/api-port-pages";
import { ideasPort } from "@/server/api-port/ideas/ideas";
import { nudgesPort } from "@/server/api-port/nudges/nudges";
import { filesPort } from "@/server/api-port/api-port-files";
import { bookingsPort } from "@/server/api-port/bookings/bookings";
import { explorePort } from "@/server/api-port/api-port-explore";
import { kitsPort } from "@/server/api-port/api-port-kits";
import { wishListsPort } from "@/server/api-port/wish-lists/wish-lists-port";
import { mapPort } from "@/server/api-port/api-port-map";
import { calendarImportPort } from "@/server/api-port/calendar-import/api-port-calendar-import";
import { settingsPort } from "@/server/api-port/api-port-settings";
import { feedbackPort } from "@/server/api-port/feedback/api-port-feedback";
import { analyticsPort } from "@/server/api-port/analytics/api-port-analytics";
import { socialPort } from "@/server/api-port/api-port-social";
import { weatherPort } from "@/server/api-port/api-port-weather";
import { calendarPort } from "@/server/api-port/api-port-calendar";
import { daysPort } from "@/server/api-port/days/api-port-days";
import { notificationsPort } from "@/server/api-port/notifications/notifications";
import { refresh } from "@/server/freshness";
import { emailConfigured } from "@/server/auth/email";
import { findTripByShareLink, inviteToTrip, joinWithLink } from "@/server/trips/invites";
import { mintShareToken } from "@/server/trips/invite-link";
import {
  listDaysWithEvents,
} from "@/server/itinerary/itinerary";
import { listExpenses, listSettlements, listSplits } from "@/server/money/money";
import { removeEvent, saveEvent } from "@/server/itinerary/event-save";
import { settleUpFor, settleWithFor } from "@/server/money/settle-up";
import { recordTransfers, removeExpense, saveExpense } from "@/server/money/money-save";
import { listAvailability, setAvailability, setPreferredDays } from "@/server/itinerary/availability";
import { listLengthChoices, setLengthChoice } from "@/server/itinerary/trip-length";
import { listGuests } from "@/server/guests/guests";
import { listDocuments } from "@/server/documents/documents";
import { listTripPlaces, searchPlaces as geocode } from "@/server/itinerary/places";
import { applyOvernight } from "@/server/itinerary/overnight";
import {
  ensureProfile,
  loadIdentity,
  updateProfileFields,
} from "@/server/auth/profile";
import { listPersonalPackingLines } from "@/server/packing/packing";
import { readPackingBoard } from "@/server/packing/packing-board";
import {
  addLine,
  applyKit,
  fillBag,
  removeSuggested,
  takeIdea,
  removeLine,
  removeLines,
  renameLine,
  resetList,
  setClaim,
  setPacked,
  setTier,
  stepQuantity,
} from "@/server/packing/packing-save";
import { insertPackingKit, insertPackingKitItem, softDeletePackingKit } from "@/server/packing/packing-kits";
import { canUseFeature } from "@/server/billing/entitlements";
import { readVibeTags } from "@floc/core/trip/vibe-tags";
import { travelMapFor } from "@/server/itinerary/travel-map";
import { leaveTripAs, removeMembership, setMemberRoleAdmin } from "@/server/trips/roster";
import {
  listTripsFor,
  resetInviteToken,
  setTripArchived,
  setTripMuted,
  setTripStarred,
  softDeleteTrip,
} from "@/server/trips/trips";

function toDetail(access: TripAccess): TripDetail {
  return {
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
      avatarIcon: m.avatarIcon,
      tone: m.tone,
    })),
  };
}

export const webPort: FlocPort = {
  ...settingsPort,
  ...feedbackPort,
  ...analyticsPort,
  ...calendarImportPort,
  ...mapPort,
  ...kitsPort,
  ...wishListsPort,
  ...filesPort,
  ...bookingsPort,
  ...commentsPort,
  ...pagesPort,
  ...ideasPort,
  ...nudgesPort,
  ...socialPort,
  ...billingPort,
  ...estimatePort,
  ...weatherPort,
  ...calendarPort,
  ...daysPort,
  ...notificationsPort,
  ...explorePort,

  async loadPacking(viewerId, tripId): Promise<PackingBoard> {
    const access = await scoped(viewerId, tripId);
    const { lines: shared, claims, mine, kits, tier, plan, packingPro: canAutoFill, ideas } =
      await readPackingBoard(access.trip, viewerId);

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
        suggested: line.origin === "suggested",
      })),
      tier,
      kits: kits.map((kit) => ({ id: kit.id, name: kit.name, itemCount: kit.itemCount })),
      canAutoFill,
      ideas,
      plan,
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

  async takePackingIdea(viewerId, tripId, label) {
    await takeIdea(await scoped(viewerId, tripId), label);
  },

  async removeSuggestedPacking(viewerId, tripId) {
    await removeSuggested(await scoped(viewerId, tripId));
  },

  async applyPackingKit(viewerId, tripId, kitId) {
    await applyKit(await scoped(viewerId, tripId), kitId);
  },

  async savePackingKit(viewerId, tripId, name): Promise<boolean> {
    await scoped(viewerId, tripId);
    const lines = await listPersonalPackingLines(tripId, viewerId);
    const kitId = await insertPackingKit(viewerId, name);
    if (kitId === null) return false;
    for (const line of lines) {
      await insertPackingKitItem(kitId, viewerId, line.label, line.category, line.quantity);
    }
    refresh({ kind: "packing", tripId });
    return true;
  },

  async deletePackingKit(viewerId, kitId) {
    await softDeletePackingKit(kitId, viewerId);
  },

  async loadMyProfile(viewerId): Promise<MyProfile> {
    const profile = await ensureProfile(viewerId);
    const map = await travelMapFor(viewerId);

    return {
      vibeTags: readVibeTags(profile.vibeTags),
      map: Object.entries(map.states).map(([code, state]) => ({ code, state })),
      been: map.visited,
      wantToGo: map.wantToGo,
    };
  },

  async loadMe(viewerId): Promise<Me> {
    await ensureProfile(viewerId);
    const [identity, map, trips] = await Promise.all([
      loadIdentity(viewerId),
      travelMapFor(viewerId),
      listTripsFor(viewerId, { archived: false }),
    ]);
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
    refresh({ kind: "tripList" });
  },

  listTrips: (viewerId, options) => listTripCards(viewerId, options),

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
        clearsAmountMinor: s.clearsAmountMinor,
        clearsCurrency: s.clearsCurrency,
      })),
    };
  },

  async listAvailability(viewerId, tripId): Promise<Availability[]> {
    await scoped(viewerId, tripId);
    return listAvailability(tripId);
  },

  async listTripGuests(viewerId, tripId) {
    await scoped(viewerId, tripId);
    return listGuests(tripId);
  },

  async setAvailability(viewerId, tripId, dates, available) {
    await scoped(viewerId, tripId);
    await setAvailability(tripId, viewerId, dates, available);
    refresh({ kind: "tripDates", tripId });
  },

  async setPreferredDays(viewerId, tripId, dates, preferred) {
    await scoped(viewerId, tripId);
    await setPreferredDays(tripId, viewerId, dates, preferred);
    refresh({ kind: "tripDates", tripId });
  },

  async listLengthChoices(viewerId, tripId) {
    await scoped(viewerId, tripId);
    return listLengthChoices(tripId);
  },

  async setLengthChoice(viewerId, tripId, length, picked) {
    await scoped(viewerId, tripId);
    await setLengthChoice(tripId, viewerId, length, picked);
    refresh({ kind: "tripDates", tripId });
  },

  async listFiles(viewerId, tripId): Promise<TripFile[]> {
    await scoped(viewerId, tripId);
    const [rows, reads] = await Promise.all([listDocuments(tripId, viewerId), canUseFeature("bookings.autoFile", viewerId)]);
    return rows.map((d) => ({
      booking: reads ? d.booking : null,
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
    return { id: await startTrip(viewerId, input) };
  },

  async startTripFromPreset(viewerId, choice, along = []) {
    await ensureProfile(viewerId);
    const id = await copyListing(viewerId, choice);
    if (id === null) return null;
    refresh({ kind: "tripList" });
    if (along.length && (await inviteToTrip({ tripId: id, fromUserId: viewerId, toUserIds: along }))) refresh({ kind: "invites" });
    return { id };
  },

  async updateTrip(viewerId, tripId, patch: TripPatch) {
    await saveTrip(await scoped(viewerId, tripId), patch);
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
    refresh({ kind: "tripOverview", tripId }, { kind: "tripDates", tripId });
    return mintShareToken(minted);
  },

  async joinByToken(viewerId, token) {
    const found = await findTripByShareLink(token);
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

  async loadPairs(viewerId, tripId) {
    await scoped(viewerId, tripId);
    return settleUpFor(tripId, viewerId);
  },

  async settlePair(viewerId, tripId, otherUserId) {
    const refusal = await settleWithFor(await scoped(viewerId, tripId), otherUserId);
    if (refusal) throw refusal;
  },

  async deleteExpense(viewerId, tripId, expenseId) {
    await removeExpense(await scoped(viewerId, tripId), expenseId);
  },

  async addEvent(viewerId, tripId, dayId, input) {
    await saveEvent(await scoped(viewerId, tripId), { dayId }, input);
  },

  async updateEvent(viewerId, tripId, eventId, input) {
    await saveEvent(await scoped(viewerId, tripId), { eventId }, input);
  },

  async deleteEvent(viewerId, tripId, eventId) {
    await removeEvent(await scoped(viewerId, tripId), eventId);
  },
};
