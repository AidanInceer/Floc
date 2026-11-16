import { asText } from "../text/text";

export type IsoDate = string;

export function today(): IsoDate {
  return toIsoDate(new Date());
}

export function toIsoDate(d: Date): IsoDate {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function fromIsoDate(date: IsoDate): Date {
  return new Date(`${date}T00:00:00Z`);
}

export function isIsoDate(value: unknown): value is IsoDate {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && toIsoDate(parsed) === value;
}

export function readIsoDate(value: unknown): IsoDate | null {
  return isIsoDate(value) ? value : null;
}

export function readOptionalIsoDate(value: unknown): IsoDate | null | undefined {
  const raw = asText(value).trim();
  if (!raw) return null;
  return isIsoDate(raw) ? raw : undefined;
}

export function addDays(date: IsoDate, days: number): IsoDate {
  const d = fromIsoDate(date);
  d.setUTCDate(d.getUTCDate() + days);
  return toIsoDate(d);
}

export function dateRange(
  start: IsoDate | null,
  end: IsoDate | null,
): IsoDate[] {
  if (!start || !end || start > end) return [];
  const out: IsoDate[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) out.push(d);
  return out;
}

export function nightsBetween(start: IsoDate, end: IsoDate): number {
  return Math.max(
    0,
    Math.round(
      (fromIsoDate(end).getTime() - fromIsoDate(start).getTime()) / 86_400_000,
    ),
  );
}

export function formatDate(
  date: IsoDate | null,
  opts?: { year?: boolean; weekday?: boolean },
) {
  if (!date) return "—";
  return fromIsoDate(date).toLocaleDateString("en-GB", {
    weekday: opts?.weekday === false ? undefined : "short",
    day: "numeric",
    month: "short",
    year: opts?.year ? "numeric" : undefined,
    timeZone: "UTC",
  });
}

export function dayParts(date: IsoDate): { weekday: string; day: number } {
  const weekday = fromIsoDate(date).toLocaleDateString("en-GB", { weekday: "short", timeZone: "UTC" });
  return { weekday, day: Number(date.slice(8, 10)) };
}

export function formatDateRange(
  start: IsoDate | null,
  end: IsoDate | null,
): string {
  if (!start && !end) return "Dates not set";
  if (start && !end) return `From ${formatDate(start)}`;
  if (!start && end) return `Until ${formatDate(end)}`;
  return `${formatDate(start)} – ${formatDate(end, { year: true, weekday: false })}`;
}

export function formatShortRange(start: IsoDate, end: IsoDate): string {
  const from = formatDate(start, { weekday: false });
  const to = formatDate(end, { weekday: false });
  if (start === end) return from;
  if (start.slice(0, 7) === end.slice(0, 7)) return `${Number(start.slice(8, 10))}–${to}`;
  return `${from} – ${to}`;
}

export function hasEnded(endDate: IsoDate | null): boolean {
  return !!endDate && endDate < today();
}

export function underway(trip: { startDate: IsoDate | null; endDate: IsoDate | null }, day: IsoDate): boolean {
  return trip.startDate !== null && trip.endDate !== null && trip.startDate <= day && day <= trip.endDate;
}

export function splitEnded<T extends { endDate: IsoDate | null }>(
  items: readonly T[],
): { live: T[]; ended: T[] } {
  const live: T[] = [];
  const ended: T[] = [];
  for (const item of items) (hasEnded(item.endDate) ? ended : live).push(item);
  return { live, ended };
}

export function daysUntil(date: IsoDate | null): number | null {
  if (!date) return null;
  return Math.round(
    (fromIsoDate(date).getTime() - fromIsoDate(today()).getTime()) / 86_400_000,
  );
}

export function countdownLabel(startDate: IsoDate | null): string | null {
  const n = daysUntil(startDate);
  if (n === null) return null;
  if (n > 1) return `in ${n} days`;
  if (n === 1) return "tomorrow";
  if (n === 0) return "today";
  return null;
}
