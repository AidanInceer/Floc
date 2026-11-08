/**
 * How a subscription reads on the settings page (#247). Pure, so "renews" versus "ends" — the
 * reason the record stores a period end rather than a boolean — is testable without Stripe.
 *
 * Why: `isLive` mirrors `server/billing/entitlements.ts` on purpose; that one guards features, this one
 * only picks words. Both stay short enough to read side by side so neither drifts.
 */
import { formatDate, toIsoDate } from "../dates/dates";

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

// Why: Stripe's portal leaves a cancelled subscription `active` with `cancel_at_period_end`, so
// the honest word is "ends" — they keep Pro until the date and must not be told it renews.
export function renewalLabel(s: SubscriptionFacts, now = new Date()): string {
  if (!isLive(s, now)) return "Your Pro access has ended.";
  if (!s.currentPeriodEnd) return "Never expires.";

  const when = formatDate(toIsoDate(s.currentPeriodEnd), {
    weekday: false,
    year: true,
  });

  return s.cancelAtPeriodEnd ? `Ends ${when}` : `Renews ${when}`;
}
