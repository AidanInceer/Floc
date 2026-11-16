import { today, type IsoDate } from "../dates/dates";

export type TripListStage = "Archived" | "Needs you" | "Ended" | "Happening now" | "Planning";

export function tripListStage(
  trip: {
    startDate: IsoDate | null;
    endDate: IsoDate | null;
    needsYou?: boolean;
    archived?: boolean;
  },
  on: IsoDate = today(),
): TripListStage {
  if (trip.archived) return "Archived";
  if (trip.endDate && trip.endDate < on) return "Ended";
  if (trip.needsYou) return "Needs you";
  if (trip.startDate && trip.startDate <= on && (!trip.endDate || on <= trip.endDate)) {
    return "Happening now";
  }
  return "Planning";
}
