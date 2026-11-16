import type { BookingDetails } from "@floc/core/documents/booking/booking-details";
import type { DocCategory } from "@floc/core/documents/documents";

export type WaitingBookingFile = {
  id: number;
  name: string;
  mimeType: string;
  sizeBytes: number;
  category: DocCategory;
  booking: BookingDetails | null;
  arrivedAt: string;
  daysLeft: number;
};

export type BookingsArea = {
  files: WaitingBookingFile[];
  trips: { id: number; name: string }[];
  usage: { usedBytes: number; quotaBytes: number };
  address: string | null;
  canUpload: boolean;
};

export type BookingsPort = {
  bookingsArea(viewerId: string): Promise<BookingsArea>;

  waitingBookingCount(viewerId: string): Promise<number>;

  uploadWaitingBooking(
    viewerId: string,
    input: { name: string; mimeType: string; contentBase64: string },
  ): Promise<string | null>;

  placeWaitingBooking(viewerId: string, fileId: number, tripId: number): Promise<string | null>;

  removeWaitingBooking(viewerId: string, fileId: number): Promise<void>;
};
