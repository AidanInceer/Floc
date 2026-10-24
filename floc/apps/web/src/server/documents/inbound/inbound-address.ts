/**
 * The address a member forwards a booking to (#328, ADR-027).
 *
 * Why signed, not stored: the trip number alone would let anyone post files
 * at any trip, and a column would need a migration and a reset path for a
 * secret nobody has asked to reset. Signed with the session secret, like
 * `calendar-link`; rotating it changes every trip's address.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

import { requireInProduction } from "@/lib/env";

import { documentsEnabled } from "../document-store";

// 12 hex characters: 48 bits, past guessing, short enough to read aloud.
const SIGNATURE_LENGTH = 12;

function domain(): string | null {
  return process.env.FLOC_INBOUND_DOMAIN?.trim().toLowerCase() || null;
}

function sign(tripId: number): string {
  const secret = requireInProduction("BETTER_AUTH_SECRET", "dev-only-secret-change-me");
  return createHmac("sha256", secret)
    .update(`inbound:${tripId}`)
    .digest("hex")
    .slice(0, SIGNATURE_LENGTH);
}

export function inboundAddress(tripId: number): string | null {
  const host = domain();
  return host ? `trip-${tripId}-${sign(tripId)}@${host}` : null;
}

/** The address to show a member: none unless mail can come in and files can land (rule 11). */
export function tripInboxAddress(tripId: number): string | null {
  return process.env.RESEND_WEBHOOK_SECRET && documentsEnabled() ? inboundAddress(tripId) : null;
}

export function tripForInboundAddress(raw: string): number | null {
  const host = domain();
  if (!host) return null;
  const match = /<([^>]+)>/.exec(raw);
  const address = (match ? match[1] : raw).trim().toLowerCase();
  const parts = /^trip-(\d+)-([0-9a-f]+)@(.+)$/.exec(address);
  if (!parts || parts[3] !== host) return null;

  const tripId = Number(parts[1]);
  if (!Number.isSafeInteger(tripId)) return null;
  const expected = Buffer.from(sign(tripId));
  const given = Buffer.from(parts[2]);
  return expected.length === given.length && timingSafeEqual(expected, given) ? tripId : null;
}
