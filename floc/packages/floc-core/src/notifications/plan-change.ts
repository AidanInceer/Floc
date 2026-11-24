import { formatDate } from "../dates/dates";
import type { ActivityKind } from "./rules";

export const PLAN_CHANGE_KINDS = ["event_added", "event_moved", "event_removed"] as const satisfies ActivityKind[];
export type PlanChangeKind = (typeof PLAN_CHANGE_KINDS)[number];

export type EventSpot = { date: string; time: string | null };
export type PlanChange = EventSpot & { eventId: number; title: string; before: EventSpot | null };

export function isPlanChange(kind: ActivityKind): kind is PlanChangeKind {
  return (PLAN_CHANGE_KINDS as readonly ActivityKind[]).includes(kind);
}

export const writePlanChange = (change: PlanChange): string => JSON.stringify(change);

const isSpot = (value: unknown): value is EventSpot => {
  if (typeof value !== "object" || value === null) return false;
  const { date, time } = value as Record<string, unknown>;
  return typeof date === "string" && (time === null || typeof time === "string");
};

export function readPlanChange(detail: string | null | undefined): PlanChange | null {
  if (!detail) return null;
  try {
    const value: unknown = JSON.parse(detail);
    if (!isSpot(value)) return null;
    const { eventId, title, before } = value as Partial<PlanChange>;
    if (typeof eventId !== "number" || typeof title !== "string") return null;
    if (before !== null && !isSpot(before)) return null;
    return { eventId, title, date: value.date, time: value.time, before };
  } catch {
    return null;
  }
}

export function mergeMove(previous: string | null, next: PlanChange): PlanChange {
  return { ...next, before: readPlanChange(previous)?.before ?? next.before };
}

const clock = (time: string | null) => time ?? "All day";
const whole = (spot: EventSpot) => `${formatDate(spot.date)} ${clock(spot.time)}`;

export function spotWords(kind: PlanChangeKind, change: PlanChange): { was: string | null; now: string | null } {
  if (kind === "event_added") return { was: null, now: whole(change) };
  if (kind === "event_removed") return { was: whole(change), now: null };
  const before = change.before ?? change;
  if (before.date === change.date) return { was: clock(before.time), now: clock(change.time) };
  return { was: whole(before), now: whole(change) };
}

export function orderPlanChanges<T extends { id: number; change: EventSpot }>(rows: T[]): T[] {
  return [...rows].sort(
    (a, b) =>
      a.change.date.localeCompare(b.change.date) ||
      (a.change.time ?? "").localeCompare(b.change.time ?? "") ||
      a.id - b.id,
  );
}

export const planChangeHref = (href: string, notificationId: number) => `${href}?change=${notificationId}`;
