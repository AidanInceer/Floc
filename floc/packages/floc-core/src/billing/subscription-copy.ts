import { formatDate, toIsoDate } from "../dates/dates";

export type SubscriptionFacts = {
  status: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: Date | null;
};

const LIVE_STATUSES = ["active", "trialing"];

export function isLive(s: SubscriptionFacts, now = new Date()): boolean {
  if (!LIVE_STATUSES.includes(s.status)) return false;
  return s.currentPeriodEnd === null || s.currentPeriodEnd > now;
}

export function renewalLabel(s: SubscriptionFacts, now = new Date()): string {
  if (!isLive(s, now)) return "Your Pro access has ended.";
  if (!s.currentPeriodEnd) return "Never expires.";

  const when = formatDate(toIsoDate(s.currentPeriodEnd), {
    weekday: false,
    year: true,
  });

  return s.cancelAtPeriodEnd ? `Ends ${when}` : `Renews ${when}`;
}

export function yearlySaving(
  monthlyMinor: number,
  yearlyMinor: number,
): number | null {
  const twelve = monthlyMinor * 12;
  if (twelve <= 0) return null;

  const saved = Math.round(((twelve - yearlyMinor) / twelve) * 100);
  return saved > 0 ? saved : null;
}
