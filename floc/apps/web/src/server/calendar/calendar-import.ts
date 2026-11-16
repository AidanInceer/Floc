import "server-only";

import { auth, enabledProviders } from "@/server/auth/auth";
import { calendarAccountOf, forgetCalendarScope } from "@/server/calendar/calendar-access";
import { calendarAllDayOnly } from "@/server/calendar/calendar-options";
import { listPrimaryEvents, revokeGoogleToken } from "@/server/calendar/google-calendar";
import { listMarkedDates, setAvailability } from "@/server/itinerary/availability";
import { busyDays, importRange, planFill } from "@floc/core/dates/calendar-import";
import { isIsoDate } from "@floc/core/dates/dates";

export type CalendarFill =
  | { status: "filled"; free: number; busy: number }
  | { status: "needs-access" }
  | { status: "error"; message: string };

const REFUSED = "Google didn't give access. Nothing changed.";
const UNREACHABLE = "Google Calendar didn't answer. Nothing changed.";

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

  const plan = planFill(range, await listMarkedDates(tripId, userId), new Set(busyDays(read.events, range, { allDayOnly: await calendarAllDayOnly(userId) })));
  await setAvailability(tripId, userId, plan.free, true);
  await setAvailability(tripId, userId, plan.busy, false);
  return { status: "filled", free: plan.free.length, busy: plan.busy.length };
}

export async function removeCalendarAccess(userId: string): Promise<string | null> {
  const accountId = await calendarAccountOf(userId);
  if (!accountId) return null;
  const token = await accessTokenFor(userId, accountId);
  if (token && !(await revokeGoogleToken(token))) return "Google didn't answer, so access is still on. Try again.";
  await forgetCalendarScope(userId, accountId);
  return null;
}

export async function revokeGoogleGrant(userId: string): Promise<void> {
  const accountId = await calendarAccountOf(userId);
  const token = accountId ? await accessTokenFor(userId, accountId) : null;
  if (token) await revokeGoogleToken(token);
}
