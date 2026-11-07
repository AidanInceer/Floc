/**
 * Fill a member's days from their Google calendar (#444, ADR-031). One path for the web page and
 * the phone's API port; who may call it (rule 5) is the caller's `requireTripAccess` / `scoped`.
 *
 * Why only the viewer's marks: there is no user parameter other than the viewer, so no request
 * can fill somebody else's days (rule 6).
 */
import "server-only";

import { auth, enabledProviders } from "@/server/auth/auth";
import { calendarAccountOf, forgetCalendarScope } from "@/server/calendar/calendar-access";
import { listPrimaryEvents, revokeGoogleToken } from "@/server/calendar/google-calendar";
import { listMarkedDates, setAvailability } from "@/server/itinerary/availability";
import { busyDays, importRange, planFill } from "@floc/core/dates/calendar-import";
import { isIsoDate } from "@floc/core/dates/dates";

export type CalendarFill =
  | { status: "filled"; free: number; busy: number }
  /** Google has not been given the calendar yet (or has let it go): the caller starts the consent. */
  | { status: "needs-access" }
  | { status: "error"; message: string };

const REFUSED = "Google didn't give access. Nothing changed.";
const UNREACHABLE = "Google Calendar didn't answer. Nothing changed.";

/** Rule 11: with no Google key the feature is absent, not broken. */
export const calendarEnabled = () => enabledProviders.google;

export async function hasCalendarAccess(userId: string): Promise<boolean> {
  return calendarEnabled() && (await calendarAccountOf(userId)) !== null;
}

async function accessTokenFor(userId: string, accountId: string): Promise<string | null> {
  try {
    const { accessToken } = await auth.api.getAccessToken({ body: { accountId, userId } });
    return accessToken || null;
  } catch {
    return null;
  }
}

export async function fillFromCalendar(input: {
  tripId: number;
  userId: string;
  startDate: string | null;
  endDate: string | null;
  /** `YYYY-MM`, the month on screen: the range only when the trip has no dates. */
  month: string;
}): Promise<CalendarFill> {
  const { tripId, userId } = input;
  if (!calendarEnabled()) return { status: "error", message: REFUSED };
  if (!isIsoDate(`${input.month}-01`)) return { status: "error", message: "That isn't a month." };

  const accountId = await calendarAccountOf(userId);
  if (!accountId) return { status: "needs-access" };
  const token = await accessTokenFor(userId, accountId);
  if (!token) return { status: "needs-access" };

  const range = importRange(input.startDate, input.endDate, input.month);
  const read = await listPrimaryEvents(token, range);
  if (!read.ok) return read.reason === "denied" ? { status: "needs-access" } : { status: "error", message: UNREACHABLE };

  const plan = planFill(range, await listMarkedDates(tripId, userId), new Set(busyDays(read.events, range)));
  await setAvailability(tripId, userId, plan.free, true);
  await setAvailability(tripId, userId, plan.busy, false);
  return { status: "filled", free: plan.free.length, busy: plan.busy.length };
}

/** Null when removed; otherwise the sentence that says why not. Revokes at Google first. */
export async function removeCalendarAccess(userId: string): Promise<string | null> {
  const accountId = await calendarAccountOf(userId);
  if (!accountId) return null;
  const token = await accessTokenFor(userId, accountId);
  // Why still forget on no token: nothing is left to revoke, and the row must stop saying yes.
  if (token && !(await revokeGoogleToken(token))) return "Google didn't answer, so access is still on. Try again.";
  await forgetCalendarScope(userId, accountId);
  return null;
}

/**
 * On account deletion: revoke at Google, so Floc leaves the person's Google third-party access list rather than
 * only dropping its copy of the token. Why it never throws: deleting an account must not wait on Google.
 */
export async function revokeGoogleGrant(userId: string): Promise<void> {
  const accountId = await calendarAccountOf(userId);
  const token = accountId ? await accessTokenFor(userId, accountId) : null;
  if (token) await revokeGoogleToken(token);
}
