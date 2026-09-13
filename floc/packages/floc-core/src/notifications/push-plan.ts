/** Who gets a push or an email this run, and what it says (#345, #346). Held items stay pending and fold into a later send. */
export const PUSH_WAIT_MS = 2 * 60_000;
export const PUSH_TRIP_GAP_MS = 15 * 60_000;
export const PUSH_DAY_CAP = 6;
/** Why: longer than push, so something already seen in the app is read before its email goes. */
export const EMAIL_WAIT_MS = 10 * 60_000;
const DAY_MS = 86_400_000;

export type Limits = { tripGapMs: number; dayCap: number };
export const PUSH_LIMITS: Limits = { tripGapMs: PUSH_TRIP_GAP_MS, dayCap: PUSH_DAY_CAP };
export const EMAIL_LIMITS: Limits = { tripGapMs: 60 * 60_000, dayCap: 3 };

export type PendingPush = {
  notificationId: number;
  userId: string;
  tripId: number | null;
  tripName: string | null;
  text: string;
  href: string;
  /** Reminders: sent past the limits and never counted against them. */
  exempt?: boolean;
};

export type SentPush = { userId: string; tripId: number | null; sentAt: Date };

export type PlannedPush = {
  userId: string;
  tripId: number | null;
  title: string;
  body: string;
  href: string;
  notificationIds: number[];
  /** Each item's own words, in `notificationIds` order — an email lists them. */
  lines: string[];
  exempt?: boolean;
};

function groupByPersonAndTrip(pending: PendingPush[]): PendingPush[][] {
  const groups = new Map<string, PendingPush[]>();
  for (const item of pending) {
    const key = `${item.userId}:${item.tripId ?? ""}:${item.exempt ? "exempt" : ""}`;
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  return [...groups.values()];
}

function message(items: PendingPush[]): PlannedPush {
  const [first] = items;
  const oneHref = items.every((i) => i.href === first.href);
  return {
    userId: first.userId,
    tripId: first.tripId,
    title: first.tripName ?? "Floc",
    body: items.length === 1 ? first.text : `${items.length} new things`,
    href: oneHref ? first.href : "/inbox",
    notificationIds: items.map((i) => i.notificationId),
    lines: items.map((i) => i.text),
    ...(first.exempt ? { exempt: true } : {}),
  };
}

export function planPushes(
  pending: PendingPush[],
  sent: SentPush[],
  now: Date,
  limits: Limits = PUSH_LIMITS,
): PlannedPush[] {
  const recent = sent.filter((s) => now.getTime() - s.sentAt.getTime() < DAY_MS);
  const plan: PlannedPush[] = [];

  for (const items of groupByPersonAndTrip(pending)) {
    const { userId, tripId, exempt } = items[0];
    if (exempt) {
      plan.push(message(items));
      continue;
    }
    const today = [...recent.filter((s) => s.userId === userId), ...plan.filter((p) => p.userId === userId && !p.exempt)];
    const tripTooSoon = recent.some(
      (s) => s.userId === userId && s.tripId === tripId && now.getTime() - s.sentAt.getTime() < limits.tripGapMs,
    );
    if (tripTooSoon || today.length >= limits.dayCap) continue;
    plan.push(message(items));
  }
  return plan;
}
