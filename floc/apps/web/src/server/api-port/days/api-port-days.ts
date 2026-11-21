import "server-only";

import { Refusal } from "@floc/core/errors/refusal";
import type { FlocPort } from "@floc/api/port";

import { scoped } from "@/server/api-port/api-port-scope";
import { dayRemovalPlanFor, removeTripDay } from "@/server/itinerary/removal/remove-day";

type DaysPort = Pick<FlocPort, "dayRemovalPlan" | "removeDay">;

export const daysPort: DaysPort = {
  async dayRemovalPlan(viewerId, tripId, dayId) {
    const access = await scoped(viewerId, tripId);
    const target = await access.day(dayId);
    const plan = await dayRemovalPlanFor(access.trip, target.id, viewerId);
    if (!plan) throw new Refusal("That day is not on this trip.", "missing");
    return plan;
  },

  async removeDay(viewerId, tripId, dayId) {
    const access = await scoped(viewerId, tripId);
    const target = await access.day(dayId);
    await removeTripDay(access.trip, target.id, viewerId);
  },
};
