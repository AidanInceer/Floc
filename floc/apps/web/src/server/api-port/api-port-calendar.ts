import "server-only";

import type { FlocPort } from "@floc/api/port";

import { appUrl } from "@/lib/env";
import { scoped } from "@/server/api-port/api-port-scope";
import { mintCalendarToken } from "@/server/itinerary/calendar-link";

type CalendarPort = Pick<FlocPort, "calendarFeedUrl">;

export const calendarPort: CalendarPort = {
  async calendarFeedUrl(viewerId, tripId) {
    await scoped(viewerId, tripId);
    return `${appUrl()}/calendar/${mintCalendarToken(tripId, viewerId)}.ics`;
  },
};
