/** Who gets a push this minute, and what it says (#345). Held items stay pending and fold into a later push. */
export const PUSH_WAIT_MS = 2 * 60_000;
export const PUSH_TRIP_GAP_MS = 15 * 60_000;
export const PUSH_DAY_CAP = 6;
const DAY_MS = 86_400_000;

export type PendingPush = {
  notificationId: number;
  userId: string;
  tripId: number | null;
  tripName: string | null;
  text: string;
  href: string;
};

export type SentPush = { userId: string; tripId: number | null; sentAt: Date };

export type PlannedPush = {
  userId: string;
  tripId: number | null;
  title: string;
  body: string;
  href: string;
  notificationIds: number[];
};

function groupByPersonAndTrip(pending: PendingPush[]): PendingPush[][] {
  const groups = new Map<string, PendingPush[]>();
  for (const item of pending) {
    const key = `${item.userId}:${item.tripId ?? ""}`;
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
  };
}

export function planPushes(pending: PendingPush[], sent: SentPush[], now: Date): PlannedPush[] {
  const recent = sent.filter((s) => now.getTime() - s.sentAt.getTime() < DAY_MS);
  const plan: PlannedPush[] = [];

  for (const items of groupByPersonAndTrip(pending)) {
    const { userId, tripId } = items[0];
    const today = [...recent.filter((s) => s.userId === userId), ...plan.filter((p) => p.userId === userId)];
    const tripTooSoon = recent.some(
      (s) => s.userId === userId && s.tripId === tripId && now.getTime() - s.sentAt.getTime() < PUSH_TRIP_GAP_MS,
    );
    if (tripTooSoon || today.length >= PUSH_DAY_CAP) continue;
    plan.push(message(items));
  }
  return plan;
}
