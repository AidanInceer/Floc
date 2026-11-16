export const ANALYTICS_EVENTS = ["page.view"] as const;
export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[number];

export const ANALYTICS_SURFACES = ["web", "ios", "android"] as const;
export type AnalyticsSurface = (typeof ANALYTICS_SURFACES)[number];

export const ANALYTICS_KEEP_DAYS = 365;

export function isAnalyticsEvent(name: unknown): name is AnalyticsEventName {
  return typeof name === "string" && (ANALYTICS_EVENTS as readonly string[]).includes(name);
}
