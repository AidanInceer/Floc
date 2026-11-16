import { createHmac, timingSafeEqual } from "node:crypto";

import { linkKey } from "@/server/auth/links/link-key";

export type CalendarHolder = { tripId: number; userId: string; epoch: number };

const CURRENT = "calendar-feed";
const LEGACY = "calendar";

function sign(domain: string, payload: string): string {
  return createHmac("sha256", linkKey("calendar-feed")).update(`${domain}:${payload}`).digest("base64url");
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
