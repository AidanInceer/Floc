/** The Bookings half of the port (#559): files that wait for their member to choose a trip. Never a trip surface. */
import type { BookingDetails } from "@floc/core/documents/booking/booking-details";
import type { DocCategory } from "@floc/core/documents/documents";

export type WaitingBookingFile = {
  id: number;
  name: string;
  mimeType: string;
  sizeBytes: number;
  category: DocCategory;
  /** What Floc read, for a Pro member. Null when nothing was read, or the viewer is on Free. */
  booking: BookingDetails | null;
  /** ISO 8601 instant: the week on the list counts from here. */
  arrivedAt: string;
  daysLeft: number;
};

export type BookingsArea = {
  files: WaitingBookingFile[];
  /** The viewer's own live trips, the only places a file can go. */
  trips: { id: number; name: string }[];
  usage: { usedBytes: number; quotaBytes: number };
  /** Where to forward a booking. Null when inbound mail or file storage is not set up (rule 11). */
  address: string | null;
  canUpload: boolean;
};

export type BookingsPort = {
  /** Only ever the viewer's own waiting files. */
  bookingsArea(viewerId: string): Promise<BookingsArea>;

  /** How many files wait, for the menu's count and the "Which trip?" prompt. */
  waitingBookingCount(viewerId: string): Promise<number>;

  /** Null when it is waiting, else the refusal in the words a form shows. */
  uploadWaitingBooking(
    viewerId: string,
    input: { name: string; mimeType: string; contentBase64: string },
  ): Promise<string | null>;

  /** Moves a waiting file to the viewer's private files on one of their trips. Null when it moved. */
  placeWaitingBooking(viewerId: string, fileId: number, tripId: number): Promise<string | null>;

  /** Off the list, and its bytes off the disk, at once (ADR-050). */
  removeWaitingBooking(viewerId: string, fileId: number): Promise<void>;
};
