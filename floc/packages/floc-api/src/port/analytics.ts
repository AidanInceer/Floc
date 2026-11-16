import type { AnalyticsEventName, AnalyticsSurface } from "@floc/core/analytics/events";

export type AnalyticsPort = {
  recordAnalytics(input: { name: AnalyticsEventName; path: string; surface: AnalyticsSurface }): Promise<void>;
};
