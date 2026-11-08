import { countdownLabel, type IsoDate } from "@floc/core/dates/dates";
import { tripListStage } from "@floc/core/trip/list-stage";

/** The status line on a My trips bar. An archived trip never reaches My trips, so a past one reads Ended (rule 4). */
export function tripBarStatus(
  trip: { startDate: IsoDate | null; endDate: IsoDate | null; needsYou?: boolean },
  next: boolean,
): string {
  const stage = tripListStage(trip);
  if (next && stage !== "Happening now") {
    const when = trip.startDate ? countdownLabel(trip.startDate) : null;
    return when ? `Next up · ${when}` : "Next up";
  }
  return stage === "Planning" ? (countdownLabel(trip.startDate) ?? stage) : stage;
}
