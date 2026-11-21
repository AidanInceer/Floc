import { formatDate, type IsoDate } from "../dates/dates";
import { countWord } from "../text/count-word";

export type RemovalPosition = "only" | "first" | "middle" | "last";

export type DayBooking = { dayId: number; label: string };

export type DayRemovalPlan = {
  date: IsoDate;
  position: RemovalPosition;
  movedDays: number;
  start: IsoDate | null;
  end: IsoDate | null;
  bookings: { label: string; movesTo: IsoDate }[];
};

type Window = { startDate: IsoDate | null; endDate: IsoDate | null };

function positionOf(index: number, count: number): RemovalPosition {
  if (count === 1) return "only";
  if (index === 0) return "first";
  if (index === count - 1) return "last";
  return "middle";
}

function windowAfter(
  days: { date: IsoDate }[],
  position: RemovalPosition,
  window: Window,
): { start: IsoDate | null; end: IsoDate | null } {
  if (position === "only" || !window.startDate || !window.endDate) return { start: null, end: null };
  if (position === "first") return { start: days[1].date, end: window.endDate };
  return { start: window.startDate, end: days[days.length - 2].date };
}

export function planDayRemoval(
  days: { id: number; date: IsoDate }[],
  dayId: number,
  window: Window,
  bookings: DayBooking[],
): DayRemovalPlan | null {
  const index = days.findIndex((d) => d.id === dayId);
  if (index === -1) return null;
  const position = positionOf(index, days.length);
  const moving = position === "first" ? [] : days.slice(index + 1);
  const landing = new Map(moving.map((d, i) => [d.id, days[index + i].date]));
  return {
    date: days[index].date,
    position,
    movedDays: moving.length,
    ...windowAfter(days, position, window),
    bookings: bookings.flatMap((b) => {
      const movesTo = landing.get(b.dayId);
      return movesTo ? [{ label: b.label, movesTo }] : [];
    }),
  };
}

function movedLine(plan: DayRemovalPlan): string {
  const days = `${countWord(plan.movedDays, "later day")} ${plan.movedDays === 1 ? "moves" : "move"}`;
  const bookings = plan.bookings.map((b) => `${b.label} moves to ${formatDate(b.movesTo)}.`);
  return [`${days} a day earlier.`, ...bookings].join(" ");
}

function windowLine(plan: DayRemovalPlan): string | null {
  if (plan.position === "only") return "The trip will have no dates.";
  if (plan.position === "first") return plan.start ? `The trip now starts ${formatDate(plan.start)}.` : null;
  return plan.end ? `The trip now ends ${formatDate(plan.end)}.` : null;
}

export function dayRemovalMessage(plan: DayRemovalPlan): string {
  const parts = [`${formatDate(plan.date)} and its events go.`];
  if (plan.movedDays > 0) parts.push(movedLine(plan));
  const window = windowLine(plan);
  if (window) parts.push(window);
  return parts.join(" ");
}

export const DAY_REMOVAL_TITLE = "Remove this day?";
