/**
 * The one address every member forwards a booking to (#559, ADR-049).
 *
 * Why it carries no trip and no secret: the proven sender says whose files a booking lands in (ADR-039), and
 * the booking's own dates say which trip. An address a member must look up per trip was the thing in the way.
 */
import { bookingsAddress } from "@floc/core/documents/booking/booking-inbox";

import { documentsEnabled } from "../document-store";

function domain(): string | null {
  return process.env.FLOC_INBOUND_DOMAIN?.trim().toLowerCase() || null;
}

/** The address to show a member: none unless mail can come in and files can land (rule 11). */
export function bookingsInboxAddress(): string | null {
  return process.env.RESEND_WEBHOOK_SECRET && documentsEnabled() ? bookingsAddress(domain()) : null;
}

/** Whether a recipient line is the shared address. An old per-trip address is not, so it saves nothing. */
export function isBookingsAddress(raw: string): boolean {
  const expected = bookingsAddress(domain());
  if (!expected) return false;
  const match = /<([^>]+)>/.exec(raw);
  return (match ? match[1] : raw).trim().toLowerCase() === expected;
}
