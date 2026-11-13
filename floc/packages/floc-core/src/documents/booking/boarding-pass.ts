/**
 * Reads the text of a boarding pass barcode (#559): IATA's Bar Coded Boarding Pass, the format every
 * airline prints. It carries the flight, the day and the airports, and no clock times.
 */
import { addDays, toIsoDate, type IsoDate } from "../../dates/dates";
import { cleanBookingDetails, type FlightDetails } from "./booking-details";

const MANDATORY_LENGTH = 58;

/**
 * Why the year is worked out: the barcode gives only the day of the year. A pass is issued for a
 * flight soon, so the year is the one that puts the flight nearest to today, never far in the past.
 */
function flightDate(dayOfYear: number, today: IsoDate): IsoDate | null {
  if (dayOfYear < 1 || dayOfYear > 366) return null;
  const year = Number(today.slice(0, 4));
  const earliest = addDays(today, -30);
  const candidates = [year, year + 1, year - 1].map((y) => {
    const date = new Date(Date.UTC(y, 0, dayOfYear));
    return date.getUTCFullYear() === y ? toIsoDate(date) : null;
  });
  return candidates.find((date) => date !== null && date >= earliest && date <= addDays(today, 335)) ?? null;
}

/** The flight on a boarding pass barcode's first leg, or null when the text is not one. */
export function readBoardingPass(barcode: unknown, today: IsoDate): FlightDetails | null {
  if (typeof barcode !== "string" || barcode.length < MANDATORY_LENGTH || barcode.length > 700) return null;
  if (!/^[MS][1-4]/.test(barcode)) return null;

  const details = cleanBookingDetails({
    kind: "flight",
    reference: barcode.slice(23, 30).trim(),
    from: barcode.slice(30, 33),
    to: barcode.slice(33, 36),
    flightNumber: `${barcode.slice(36, 39).trim()}${barcode.slice(39, 44).trim()}`,
    date: flightDate(Number(barcode.slice(44, 47)), today),
  });
  if (details?.kind !== "flight" || !details.from || !details.to || !details.flightNumber) return null;
  return details;
}
