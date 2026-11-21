import { bestDates, windowHeadline, windowReasons, type DayAnswer } from "@floc/core/dates/finding/best-dates";
import type { LengthChoice } from "@floc/core/dates/finding/trip-length";

export type BestWindow = { start: string; end: string; headline: string; reasons: string[] };

export function bestWindows(
  rows: DayAnswer[],
  lengths: LengthChoice[],
  now: string,
  nameOf: (userId: string) => string | undefined,
  viewerId: string | undefined,
): BestWindow[] {
  return bestDates(rows, lengths, now).map((w) => ({
    start: w.start,
    end: w.end,
    headline: windowHeadline(w),
    reasons: windowReasons(w, (userId) => nameOf(userId) ?? "A guest", viewerId),
  }));
}
