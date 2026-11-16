import "server-only";

import type { FlocPort } from "@floc/api/port";

import { scoped } from "@/server/api-port/api-port-scope";
import { calendarEnabled, fillFromCalendar, hasCalendarAccess, removeCalendarAccess } from "@/server/calendar/calendar-import";
import { calendarAllDayOnly, setCalendarAllDayOnly } from "@/server/calendar/calendar-options";
import { refresh } from "@/server/freshness";

type CalendarPort = Pick<FlocPort, "calendarAccess" | "fillFromCalendar" | "setCalendarAllDayOnly" | "removeCalendarAccess">;

export const calendarImportPort: CalendarPort = {
  async calendarAccess(viewerId) {
    return {
      enabled: calendarEnabled(),
      granted: await hasCalendarAccess(viewerId),
      allDayOnly: await calendarAllDayOnly(viewerId),
    };
  },

  async fillFromCalendar(viewerId, tripId, month) {
    const access = await scoped(viewerId, tripId);
    const result = await fillFromCalendar({
      tripId: access.trip.id,
      userId: viewerId,
      startDate: access.trip.startDate,
      endDate: access.trip.endDate,
      month,
    });
    if (result.status === "filled") {
      refresh({ kind: "tripDates", tripId }, { kind: "tripOverview", tripId });
    }
    return result;
  },

  setCalendarAllDayOnly: (viewerId, on) => setCalendarAllDayOnly(viewerId, on),

  async removeCalendarAccess(viewerId) {
    const refusal = await removeCalendarAccess(viewerId);
    if (!refusal) refresh({ kind: "accountSettings" });
    return refusal;
  },
};
