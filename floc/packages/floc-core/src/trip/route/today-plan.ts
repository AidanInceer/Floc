import type { IsoDate } from "../../dates/dates";
import { underway, type TripDates } from "./route-track";

type PlanDay<E> = { id: number; date: IsoDate; events: E[] };
type PlanFile = { dayId: number | null; eventDayId: number | null };

export type TodayPlan<E, F> = { date: IsoDate; events: E[]; files: F[] };

/** Null outside the trip's dates: the block appears only once the trip has started (#329). */
export function todayPlan<E, F extends PlanFile>({
  trip,
  days,
  files,
  today,
}: {
  trip: TripDates;
  days: PlanDay<E>[];
  files: F[];
  today: IsoDate;
}): TodayPlan<E, F> | null {
  if (!underway(trip, today)) return null;
  const day = days.find((d) => d.date === today);
  if (!day) return { date: today, events: [], files: [] };
  return {
    date: today,
    events: day.events,
    files: files.filter((f) => f.dayId === day.id || f.eventDayId === day.id),
  };
}
