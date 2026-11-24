import { orderPlanChanges, type EventSpot } from "./plan-change";

type OnTrip = { tripId: number | null; tripName: string | null };

export type TripGroup<T> = { tripId: number | null; tripName: string | null; items: T[] };

export const BELL_ROWS = 12;

export function groupByTrip<T extends OnTrip>(items: T[]): TripGroup<T>[] {
  const groups = new Map<number | null, TripGroup<T>>();
  for (const item of items) {
    const group = groups.get(item.tripId) ?? { tripId: item.tripId, tripName: item.tripName, items: [] };
    group.items.push(item);
    groups.set(item.tripId, group);
  }
  const all = [...groups.values()];
  return [...all.filter((g) => g.tripId !== null), ...all.filter((g) => g.tripId === null)];
}

export function planFirst<T extends { id: number; change: EventSpot | null }>(items: T[]): T[] {
  const onPlan = items.filter((item): item is T & { change: EventSpot } => item.change !== null);
  return [...orderPlanChanges(onPlan), ...items.filter((item) => item.change === null)];
}

const JOINING_WORD = /(?: (?:on the trip|to|on|from|of|for|about)|:)$/;

export function lineUnderTrip(text: string, tripName: string | null): string {
  if (!tripName || !text.endsWith(` ${tripName}`)) return text;
  return text.slice(0, -tripName.length - 1).replace(JOINING_WORD, "");
}
