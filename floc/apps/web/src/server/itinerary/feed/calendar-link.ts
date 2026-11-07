/**
 * The secret in a member's calendar feed URL (#334).
 *
 * A calendar app polls the feed with no session, so the permission rides in the
 * URL. It names one member on one trip and the link's number. It never runs out,
 * but "Reset link" raises the member's number, which ends every older link;
 * leaving the trip ends it too. Signed with the session secret, same as
 * `documents/view-link`.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

import { requireInProduction } from "@/lib/env";

export type CalendarHolder = { tripId: number; userId: string; epoch: number };

// Why two: links minted before reset existed carry no number and are signed as `calendar:`; they read as number 0.
const CURRENT = "calendar-feed";
const LEGACY = "calendar";

function sign(domain: string, payload: string): string {
  const secret = requireInProduction("BETTER_AUTH_SECRET", "dev-only-secret-change-me");
  return createHmac("sha256", secret).update(`${domain}:${payload}`).digest("base64url");
}

function signedAs(domain: string, payload: string, signature: string): boolean {
  const expected = Buffer.from(sign(domain, payload));
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

export function mintCalendarToken(tripId: number, userId: string, epoch: number): string {
  const payload = Buffer.from(`${tripId}:${epoch}:${userId}`).toString("base64url");
  return `${payload}.${sign(CURRENT, payload)}`;
}

export function readCalendarToken(token: string): CalendarHolder | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const decoded = Buffer.from(payload, "base64url").toString();
  if (signedAs(CURRENT, payload, signature)) {
    const [trip, epoch, ...user] = decoded.split(":");
    return holder(trip, epoch, user.join(":"));
  }
  if (signedAs(LEGACY, payload, signature)) {
    const split = decoded.indexOf(":");
    return split < 1 ? null : holder(decoded.slice(0, split), "0", decoded.slice(split + 1));
  }
  return null;
}

function holder(trip: string | undefined, epoch: string | undefined, userId: string): CalendarHolder | null {
  const tripId = Number(trip);
  const n = Number(epoch);
  if (!trip || !epoch || !Number.isInteger(tripId) || !Number.isInteger(n) || n < 0 || !userId) return null;
  return { tripId, userId, epoch: n };
}
