import "server-only";

import { MAX_DOCUMENT_BASE64_LENGTH } from "@floc/core/documents/documents";
import type { FlocPort } from "@floc/api/port";

import { canUseFeature } from "@/server/billing/entitlements";
import {
  bookingInboxUsage, placeWaitingBooking, removeWaitingBooking, saveWaitingBooking,
  tripsForPlacing, waitingBookings, waitingCount,
} from "@/server/documents/bookings/booking-inbox";
import { documentsEnabled } from "@/server/documents/document-store";
import { bookingsInboxAddress } from "@/server/documents/inbound/inbound-address";

type BookingsPort = Pick<FlocPort,
  "bookingsArea" | "waitingBookingCount" | "uploadWaitingBooking" | "placeWaitingBooking" | "removeWaitingBooking"
>;

export const bookingsPort: BookingsPort = {
  async bookingsArea(viewerId) {
    const [files, trips, usage, reads] = await Promise.all([
      waitingBookings(viewerId),
      tripsForPlacing(viewerId),
      bookingInboxUsage(viewerId),
      canUseFeature("bookings.autoFile", viewerId),
    ]);
    return {
      files: files.map((file) => ({
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        sizeBytes: file.sizeBytes,
        category: file.category,
        booking: reads ? file.details : null,
        arrivedAt: file.arrivedAt.toISOString(),
        daysLeft: file.daysLeft,
      })),
      trips: trips.map((trip) => ({ id: trip.id, name: trip.name })),
      usage,
      address: bookingsInboxAddress(),
      canUpload: documentsEnabled(),
    };
  },

  waitingBookingCount: (viewerId) => waitingCount(viewerId),

  async uploadWaitingBooking(viewerId, input) {
    if (!documentsEnabled()) return "File storage is not set up";
    if (input.contentBase64.length > MAX_DOCUMENT_BASE64_LENGTH) return "Files are capped at 8 MB";
    const bytes = new Uint8Array(Buffer.from(input.contentBase64, "base64"));
    if (bytes.byteLength === 0) return "That file is empty";
    return saveWaitingBooking(viewerId, { name: input.name, mimeType: input.mimeType, bytes });
  },

  placeWaitingBooking: (viewerId, fileId, tripId) => placeWaitingBooking(viewerId, fileId, tripId),

  removeWaitingBooking: (viewerId, fileId) => removeWaitingBooking(viewerId, fileId),
};
