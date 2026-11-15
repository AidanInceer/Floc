/**
 * What Floc counts about its own use (#368). An event has a name from this list, the surface and a route with
 * no ids in it. It never has a person, an address or a device, so a row cannot be tied to anyone.
 */
export const ANALYTICS_EVENTS = ["page.view"] as const;
export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[number];

export const ANALYTICS_SURFACES = ["web", "ios", "android"] as const;
export type AnalyticsSurface = (typeof ANALYTICS_SURFACES)[number];

/** Days a row is kept before it is deleted. */
export const ANALYTICS_KEEP_DAYS = 365;

export function isAnalyticsEvent(name: unknown): name is AnalyticsEventName {
  return typeof name === "string" && (ANALYTICS_EVENTS as readonly string[]).includes(name);
}
