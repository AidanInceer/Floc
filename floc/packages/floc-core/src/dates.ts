/**
 * Trip dates are date-only strings (YYYY-MM-DD) across a group that may span
 * timezones — nothing is stored with an offset, and no timezone is persisted
 * anywhere (ticket 06). Formatting uses the browser/server locale at render
 * time only.
 */

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

/** Parsed as UTC midnight so arithmetic never drifts across DST. */
export function fromIsoDate(date: IsoDate): Date {
  return new Date(`${date}T00:00:00Z`);
}

/**
 * Whether a string really is a date-only `YYYY-MM-DD` (ticket 113). The shape
 * check alone isn't enough — `2026-02-31` matches and isn't a day — so the
 * value is round-tripped through `Date` and compared back; JS rolls an
 * impossible date forward, so only a real one survives the round trip.
 */
export function isIsoDate(value: unknown): value is IsoDate {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && toIsoDate(parsed) === value;
}

/** The date if it is one, else null — the form-friendly half of `isIsoDate`. */
export function readIsoDate(value: unknown): IsoDate | null {
  return isIsoDate(value) ? value : null;
}

/**
 * An empty box is not an error — a trip with no dates is normal (rule 9).
 * `undefined` means "something was there and it wasn't a date"; the caller
 * must tell that apart from `null`.
 */
export function readOptionalIsoDate(value: unknown): IsoDate | null | undefined {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  return isIsoDate(raw) ? raw : undefined;
}

export function addDays(date: IsoDate, days: number): IsoDate {
  const d = fromIsoDate(date);
  d.setUTCDate(d.getUTCDate() + days);
  return toIsoDate(d);
}

/** Inclusive range. Returns [] if either end is missing or reversed. */
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
    // Dropping the weekday also drops the comma the locale inserts after it,
    // which is why a range's two ends must agree on this.
    weekday: opts?.weekday === false ? undefined : "short",
    day: "numeric",
    month: "short",
    year: opts?.year ? "numeric" : undefined,
    timeZone: "UTC",
  });
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

/**
 * A trip is "ended" once its end date has passed — a label, not a lock. It
 * stays fully editable (ticket 01 step 8).
 */
export function hasEnded(endDate: IsoDate | null): boolean {
  return !!endDate && endDate < today();
}

/**
 * Live trips first, finished ones apart — the trip lists fold the ended half
 * away rather than scrolling past it. Relative order is kept, so the caller
 * sorts once and splits after.
 */
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
