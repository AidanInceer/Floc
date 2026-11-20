import "server-only";

import type { FlocPort } from "@floc/api/port";

import { scoped } from "@/server/api-port/api-port-scope";
import { nudgeTargetsFor, refreshNudged, sendNudges } from "@/server/trips/nudges";

type NudgesPort = Pick<FlocPort, "nudgeTargets" | "sendNudges">;

export const nudgesPort: NudgesPort = {
  async nudgeTargets(viewerId, tripId) {
    return nudgeTargetsFor(await scoped(viewerId, tripId));
  },

  async sendNudges(viewerId, tripId, task, userIds) {
    const access = await scoped(viewerId, tripId);
    const plan = await sendNudges(access, task, userIds);
    if (plan.send.length > 0) refreshNudged(access.trip.id);
    return { sent: plan.send.length, capped: plan.capped };
  },
};
