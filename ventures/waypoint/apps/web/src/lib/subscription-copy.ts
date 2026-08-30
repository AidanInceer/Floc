/**
 * How a subscription reads on the settings page (ticket 247). Pure, so the
 * "renews" versus "ends" distinction — the whole reason the record stores a
 * period end rather than a boolean — is testable without Stripe or a request.
 *
 * `isLive` mirrors server/entitlements.ts deliberately: that one guards
 * features, this one only picks words. Neither may drift, so both are short
 * enough to read side by side.
 */
import { formatDate, toIsoDate } from "./dates";

/** The parts of a subscription row that decide the wording. */
export type SubscriptionFacts = {
  status: string;
  cancelAtPeriodEnd: boolean;
  /** Null means no end — a comp, which never lapses. */
  currentPeriodEnd: Date | null;
};

const LIVE_STATUSES = ["active", "trialing"];

export function isLive(s: SubscriptionFacts, now = new Date()): boolean {
  if (!LIVE_STATUSES.includes(s.status)) return false;
  return s.currentPeriodEnd === null || s.currentPeriodEnd > now;
}

/**
 * Cancelling in Stripe's portal leaves the subscription `active` with
 * `cancel_at_period_end` set, so the honest word is "ends" — someone who
 * cancelled keeps Pro until the date, and must not be told it renews.
 */
export function renewalLabel(s: SubscriptionFacts, now = new Date()): string {
  if (!isLive(s, now)) return "Your Pro access has ended.";
  if (!s.currentPeriodEnd) return "Never expires.";

  const when = formatDate(toIsoDate(s.currentPeriodEnd), {
    weekday: false,
    year: true,
  });

  return s.cancelAtPeriodEnd ? `Ends ${when}` : `Renews ${when}`;
}
