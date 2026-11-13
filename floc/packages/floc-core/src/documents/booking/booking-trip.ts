/**
 * Which of a member's trips a booking is for (#559). Only the booking's own dates decide, and only
 * among the trips handed in, so nothing a mail says can name a trip.
 */
import { addDays, type IsoDate } from "../../dates/dates";
import { bookingDates, type BookingDetails } from "./booking-details";

export type DatedTrip = { id: number; startDate: IsoDate | null; endDate: IsoDate | null };

/** Why a day each side: the flight out often leaves the evening before, and the one home lands the morning after. */
const MARGIN_DAYS = 1;

/** The one trip whose dates hold the booking, or null when none or more than one does. */
export function tripForBooking(details: BookingDetails | null, trips: DatedTrip[]): number | null {
  const dates = details ? bookingDates(details) : null;
  if (!dates) return null;
  const holding = trips.filter(
    (trip) =>
      trip.startDate !== null &&
      trip.endDate !== null &&
      dates.start >= addDays(trip.startDate, -MARGIN_DAYS) &&
      dates.end <= addDays(trip.endDate, MARGIN_DAYS),
  );
  return holding.length === 1 ? holding[0].id : null;
}
