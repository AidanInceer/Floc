import { phoneRoute } from "@floc/core/notifications/notification-href";

export type PushTap = { route: string; ids: number[] };

/** What a tapped push asks for (#345). Push data arrives untyped, so only an in-app path is trusted. */
export function pushTap(data: unknown): PushTap | null {
  if (typeof data !== "object" || data === null) return null;
  const { href, ids } = data as { href?: unknown; ids?: unknown };
  if (typeof href !== "string" || !href.startsWith("/")) return null;
  const numbers = Array.isArray(ids) ? ids.filter((id): id is number => typeof id === "number") : [];
  return { route: phoneRoute(href), ids: numbers };
}
