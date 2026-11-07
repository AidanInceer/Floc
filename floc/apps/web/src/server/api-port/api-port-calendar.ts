import "server-only";

import { Refusal } from "@floc/core/errors/refusal";
import type { FlocPort } from "@floc/api/port";

import { scoped } from "@/server/api-port/api-port-scope";
import { calendarFeedUrlFor, resetCalendarFeed } from "@/server/itinerary/feed/calendar-feed-link";

type CalendarPort = Pick<FlocPort, "calendarFeedUrl" | "resetCalendarFeed">;

const found = (url: string | null): string => url ?? missing();
const missing = (): never => {
  throw new Refusal("That is not on this trip.", "missing");
};

export const calendarPort: CalendarPort = {
  async calendarFeedUrl(viewerId, tripId) {
    await scoped(viewerId, tripId);
    return found(await calendarFeedUrlFor(tripId, viewerId));
  },

  async resetCalendarFeed(viewerId, tripId) {
    await scoped(viewerId, tripId);
    return found(await resetCalendarFeed(tripId, viewerId));
  },
};
