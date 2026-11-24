import "server-only";

import { cache } from "react";

import { BELL_ROWS } from "@floc/core/notifications/by-trip";
import { readProfile } from "@/server/auth/profile";
import { canUseFeature } from "@/server/billing/entitlements";
import type { TripChoice, WaitingFile } from "@floc/core/documents/booking/booking-inbox";
import { tripsForPlacing, waitingBookings, type WaitingBooking } from "@/server/documents/bookings/booking-inbox";
import { countUnread, listUnread } from "@/server/notifications/inbox";
import { countIncomingFriendRequests } from "@/server/social/friends";
import { countPendingInvitesFor } from "@/server/trips/invites";

export const TOP_BAR_PREVIEW = BELL_ROWS;

export const topBarFor = cache(async function topBarFor(userId: string, previewLimit: number) {
  const [inviteCount, friendRequestCount, profile, notificationCount, latest, waiting] =
    await Promise.all([
      countPendingInvitesFor(userId),
      countIncomingFriendRequests(userId),
      readProfile(userId),
      countUnread(userId),
      listUnread(userId, previewLimit),
      waitingBookings(userId),
    ]);
  return { inviteCount, friendRequestCount, profile, notificationCount, latest, bookings: await bookingsPrompt(userId, waiting) };
});

export type BookingsPrompt = { files: WaitingFile[]; trips: TripChoice[] };

async function bookingsPrompt(userId: string, waiting: WaitingBooking[]): Promise<BookingsPrompt> {
  if (waiting.length === 0) return { files: [], trips: [] };
  const [trips, reads] = await Promise.all([tripsForPlacing(userId), canUseFeature("bookings.autoFile", userId)]);
  return {
    files: waiting.map((file) => ({
      id: file.id,
      name: file.name,
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes,
      booking: reads ? file.details : null,
      daysLeft: file.daysLeft,
    })),
    trips: trips.map((trip) => ({ id: trip.id, name: trip.name })),
  };
}
