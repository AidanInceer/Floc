import { bookingsAddress } from "@floc/core/documents/booking/booking-inbox";

import { documentsEnabled } from "../document-store";

function domain(): string | null {
  return process.env.FLOC_INBOUND_DOMAIN?.trim().toLowerCase() || null;
}

export function bookingsInboxAddress(): string | null {
  return process.env.RESEND_WEBHOOK_SECRET && documentsEnabled() ? bookingsAddress(domain()) : null;
}

export function isBookingsAddress(raw: string): boolean {
  const expected = bookingsAddress(domain());
  if (!expected) return false;
  const match = /<([^>]+)>/.exec(raw);
  return (match ? match[1] : raw).trim().toLowerCase() === expected;
}
