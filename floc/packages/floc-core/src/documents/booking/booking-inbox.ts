import { FREE_TRIP_STORAGE_BYTES } from "../documents";
import type { BookingDetails } from "./booking-details";

export const BOOKING_INBOX_DAYS = 7;
export const BOOKING_INBOX_DELETE_DAYS = 30;
export const BOOKING_INBOX_BYTES = FREE_TRIP_STORAGE_BYTES;
export const BOOKING_INBOX_FILES = 50;
export const INBOUND_FILES_PER_MAIL = 10;
export const INBOUND_MAILS_PER_HOUR = 20;

const DAY_MS = 24 * 60 * 60 * 1000;

export const bookingInboxNote = `A file leaves this list after ${BOOKING_INBOX_DAYS} days and is deleted after ${BOOKING_INBOX_DELETE_DAYS}`;

export function bookingInboxCutoff(now: Date): Date {
  return new Date(now.getTime() - BOOKING_INBOX_DAYS * DAY_MS);
}

export function bookingInboxDeleteCutoff(now: Date): Date {
  return new Date(now.getTime() - BOOKING_INBOX_DELETE_DAYS * DAY_MS);
}

export function bookingInboxDaysLeft(arrivedAt: Date, now: Date): number {
  const left = arrivedAt.getTime() + BOOKING_INBOX_DAYS * DAY_MS - now.getTime();
  return Math.max(0, Math.ceil(left / DAY_MS));
}

export function bookingsAddress(domain: string | null | undefined): string | null {
  const host = domain?.trim().toLowerCase();
  return host ? `bookings@${host}` : null;
}

export type WaitingFile = {
  id: number;
  name: string;
  mimeType: string;
  sizeBytes: number;
  booking: BookingDetails | null;
  daysLeft: number;
};

export type TripChoice = { id: number; name: string };

export const bookingForwardWords = "Send from your sign-in email. Only you see the files.";
export const bookingForwardTitle = "Forward your booking emails";
export const bookingPrivateWords = "Only you see these files.";

export function bookingPlacingWords(reads: boolean): string {
  return reads ? "Floc adds each one to the trip with matching dates." : "With Pro, Floc adds each one to the trip with matching dates.";
}
export const bookingsEmptyWords = "Nothing waiting";
export const bookingsNoStorageWords = "File storage isn't set up yet, so there is nowhere to keep a booking.";

export function bookingInboxLeftWords(daysLeft: number): string {
  return daysLeft === 1 ? "1 day left" : `${daysLeft} days left`;
}
