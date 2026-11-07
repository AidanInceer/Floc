import { fromIsoDate, today, type IsoDate } from "@floc/core/dates/dates";
import { tripListStage } from "@floc/core/trip/list-stage";

/** Why: the web card's word — "In 33 days" says more than "Planning" once there are dates. */
export function tripCardStatus(
  trip: { startDate: IsoDate | null; endDate: IsoDate | null; needsYou: boolean },
  on: IsoDate = today(),
): string {
  const stage = tripListStage(trip, on);
  if (stage !== "Planning" || !trip.startDate) return stage;
  const days = Math.round((fromIsoDate(trip.startDate).getTime() - fromIsoDate(on).getTime()) / 86_400_000);
  if (days > 1) return `In ${days} days`;
  if (days === 1) return "Tomorrow";
  return stage;
}
