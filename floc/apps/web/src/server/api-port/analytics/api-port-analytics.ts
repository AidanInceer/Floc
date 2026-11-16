import "server-only";

import type { FlocPort } from "@floc/api/port";

import { recordEvent } from "@/server/analytics/analytics";

const PHONE_SAID_YES = { functional: false, analytics: true };

export const analyticsPort: Pick<FlocPort, "recordAnalytics"> = {
  async recordAnalytics(input) {
    await recordEvent(input, PHONE_SAID_YES);
  },
};
