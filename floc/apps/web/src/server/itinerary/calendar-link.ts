/**
 * The secret in a member's calendar feed URL (#334).
 *
 * A calendar app polls the feed with no session, so the permission rides in the
 * URL. It names one member on one trip and never runs out; what it opens is
 * re-decided on every poll from live membership, so leaving the trip closes it.
 * Signed with the session secret, same as `documents/view-link`: rotating that
 * secret kills every feed link at once.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

import { requireInProduction } from "@/lib/env";

function sign(payload: string): string {
  const secret = requireInProduction("BETTER_AUTH_SECRET", "dev-only-secret-change-me");
  return createHmac("sha256", secret).update(`calendar:${payload}`).digest("base64url");
}

export function mintCalendarToken(tripId: number, userId: string): string {
  const payload = Buffer.from(`${tripId}:${userId}`).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function readCalendarToken(
  token: string,
): { tripId: number; userId: string } | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;

  const decoded = Buffer.from(payload, "base64url").toString();
  const split = decoded.indexOf(":");
  const tripId = Number(decoded.slice(0, split));
  const userId = decoded.slice(split + 1);
  if (split < 1 || !Number.isInteger(tripId) || !userId) return null;
  return { tripId, userId };
}
