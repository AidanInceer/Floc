/**
 * Floc's own count of what is used (#368). Kept only with a yes to analytics, and only as an event name, a surface
 * and a route with no ids. The request's address and the session are never read here.
 */
import "server-only";

import { lt } from "drizzle-orm";

import { ANALYTICS_KEEP_DAYS, ANALYTICS_SURFACES, isAnalyticsEvent, type AnalyticsSurface } from "@floc/core/analytics/events";
import type { ConsentChoice } from "@floc/core/consent/consent";

import { db } from "@/db";
import { analyticsEvent } from "@/db/schema";
import { routePattern } from "@/server/observability/route-pattern";

type Seen = { name: unknown; surface: unknown; path: unknown };

export async function recordEvent(seen: Seen, consent: ConsentChoice | null): Promise<boolean> {
  if (!consent?.analytics) return false;
  if (!isAnalyticsEvent(seen.name) || typeof seen.path !== "string") return false;
  if (!(ANALYTICS_SURFACES as readonly unknown[]).includes(seen.surface)) return false;
  await db.insert(analyticsEvent).values({ name: seen.name, surface: seen.surface as AnalyticsSurface, route: routePattern(seen.path) });
  return true;
}

export async function purgeOldAnalytics(now = new Date()): Promise<number> {
  const before = new Date(now.getTime() - ANALYTICS_KEEP_DAYS * 24 * 60 * 60 * 1000);
  const gone = await db.delete(analyticsEvent).where(lt(analyticsEvent.createdAt, before)).returning({ id: analyticsEvent.id });
  return gone.length;
}
