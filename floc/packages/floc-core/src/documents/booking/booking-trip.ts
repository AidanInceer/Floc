import { addDays, type IsoDate } from "../../dates/dates";
import { bookingDates, type BookingDetails } from "./booking-details";

export type DatedTrip = { id: number; startDate: IsoDate | null; endDate: IsoDate | null };

const MARGIN_DAYS = 1;

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
