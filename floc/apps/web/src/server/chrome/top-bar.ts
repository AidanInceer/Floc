import "server-only";

import { cache } from "react";

import { getProfile } from "@/server/auth/profile";
import { subscriptionOf } from "@/server/billing/billing";
import { canUseFeature } from "@/server/billing/entitlements";
import type { TripChoice, WaitingFile } from "@floc/core/documents/booking/booking-inbox";
import { tripsForPlacing, waitingBookings, type WaitingBooking } from "@/server/documents/bookings/booking-inbox";
import { countUnread, listUnseen } from "@/server/notifications/inbox";
import { countIncomingFriendRequests } from "@/server/social/friends";
import { countPendingInvitesFor } from "@/server/trips/invites";

/**
 * Everything the top bar and account menu show, read once per request.
 * Why `cache`: with the `@modal` slot beside `children`, Next renders the root layout a second time as the
 * not-found fallback (its own comment in create-component-tree.js), so without this every request ran these twice.
 */
export const topBarFor = cache(async function topBarFor(userId: string, previewLimit: number) {
  const [inviteCount, friendRequestCount, profile, proRow, notificationCount, latest, waiting] =
    await Promise.all([
      countPendingInvitesFor(userId),
      countIncomingFriendRequests(userId),
      getProfile(userId),
      subscriptionOf(userId),
      countUnread(userId),
      listUnseen(userId, previewLimit),
      waitingBookings(userId),
    ]);
  return { inviteCount, friendRequestCount, profile, proRow, notificationCount, latest, bookings: await bookingsPrompt(userId, waiting) };
});

export type BookingsPrompt = { files: WaitingFile[]; trips: TripChoice[] };

/** Why the trips are read only when a file waits: the "Which trip?" dialog is rare, and the top bar is on every page (#559). */
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
