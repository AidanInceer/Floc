/**
 * The port's calendar half (#444, ADR-031): the same read and the same writes the Dates page and
 * Settings call, so the phone has one behaviour with the web, not a second copy of it.
 */
import "server-only";

import type { FlocPort } from "@floc/api/port";

import { scoped } from "@/server/api-port/api-port-scope";
import { calendarEnabled, fillFromCalendar, hasCalendarAccess, removeCalendarAccess } from "@/server/calendar/calendar-import";
import { refresh } from "@/server/freshness";

type CalendarPort = Pick<FlocPort, "calendarAccess" | "fillFromCalendar" | "removeCalendarAccess">;

export const calendarImportPort: CalendarPort = {
  async calendarAccess(viewerId) {
    return { enabled: calendarEnabled(), granted: await hasCalendarAccess(viewerId) };
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

  async removeCalendarAccess(viewerId) {
    const refusal = await removeCalendarAccess(viewerId);
    if (!refusal) refresh({ kind: "accountSettings" });
    return refusal;
  },
};
