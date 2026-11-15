/** The analytics half of the port (#368). */
import type { AnalyticsEventName, AnalyticsSurface } from "@floc/core/analytics/events";

export type AnalyticsPort = {
  /** Counts one event from a phone that has said yes to analytics. Takes no viewer: a count is tied to nobody. */
  recordAnalytics(input: { name: AnalyticsEventName; path: string; surface: AnalyticsSurface }): Promise<void>;
};
