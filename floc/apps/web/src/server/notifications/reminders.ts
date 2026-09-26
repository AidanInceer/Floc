/**
 * Date reminders (#346): a week before, on the day, money still owed 3 days
 * after, and a year on. Written straight into the inbox as loud notifications,
 * so push and email carry them — past the limits, obeying mute.
 */
import "server-only";

import { and, eq, inArray, isNull, or } from "drizzle-orm";

import { addDays } from "@floc/core/dates/dates";
import { CURRENCIES } from "@floc/core/money/currency";
import { ledgerBalances } from "@floc/core/money/ledger";
import { formatMoney, suggestSettlements } from "@floc/core/money/money";
import { tripHref } from "@floc/core/notifications/notification-href";
import { reminderDay, remindersDue } from "@floc/core/notifications/reminders";
import type { ReminderKind } from "@floc/core/notifications/rules";
import { db } from "@/db";
import { activity, notification, reminder, trip, tripMembership, userProfile } from "@/db/schema";
import { listExpenses, listSettlements, listSplits, namesForUsers } from "@/server/money/money";

type Target = { userId: string; detail: string | null };

async function datedTrips(day: string) {
  const lastYear = `${Number(day.slice(0, 4)) - 1}${day.slice(4)}`;
  return db
    .select({ id: trip.id, startDate: trip.startDate, endDate: trip.endDate })
    .from(trip)
    .where(
      and(
        isNull(trip.deletedAt),
        isNull(trip.archivedAt),
        or(
          inArray(trip.startDate, [addDays(day, 7), day, lastYear]),
          eq(trip.endDate, addDays(day, -3)),
        ),
      ),
    )
    .all();
}

async function listeners(tripId: number): Promise<string[]> {
  const rows = await db
    .select({ userId: tripMembership.userId, on: userProfile.notifyReminders })
    .from(tripMembership)
    .leftJoin(userProfile, eq(userProfile.userId, tripMembership.userId))
    .where(and(eq(tripMembership.tripId, tripId), isNull(tripMembership.deletedAt)))
    .all();
  return rows.filter((r) => r.on !== false).map((r) => r.userId);
}

/** Who still owes, and "Sam £40.00, Ada €12.00" for each of them. */
async function debtors(tripId: number): Promise<Target[]> {
  const [expenses, splits, settlements] = await Promise.all([
    listExpenses(tripId),
    listSplits(tripId),
    listSettlements(tripId),
  ]);
  const book = ledgerBalances({ expenses, splits, settlements });
  const transfers = CURRENCIES.flatMap((currency) =>
    suggestSettlements(book[currency] ?? {}).map((t) => ({ ...t, currency })),
  );
  const names = new Map((await namesForUsers([...new Set(transfers.map((t) => t.to))])).map((n) => [n.id, n.name]));
  const owed = new Map<string, string[]>();
  for (const t of transfers) {
    owed.set(t.from, [...(owed.get(t.from) ?? []), `${names.get(t.to) ?? "someone"} ${formatMoney(t.amountMinor, t.currency)}`]);
  }
  return [...owed].map(([userId, parts]) => ({ userId, detail: parts.join(", ") }));
}

/** Why: the reminder row's unique key is claimed first, so an overlapping run inserts nothing twice. The actor is the recipient because a date has no author. */
async function remind(kind: ReminderKind, tripId: number, target: Target): Promise<boolean> {
  return db.transaction(async (tx) => {
    const won = await tx
      .insert(reminder)
      .values({ kind, tripId, userId: target.userId })
      .onConflictDoNothing()
      .returning({ id: reminder.id })
      .all();
    if (won.length === 0) return false;
    const row = await tx
      .insert(activity)
      .values({
        kind,
        tripId,
        actorId: target.userId,
        subjectId: tripId,
        href: tripHref(tripId, kind === "still_owe" ? "money" : "overview"),
        detail: target.detail,
      })
      .returning({ id: activity.id })
      .get();
    await tx.insert(notification).values({ activityId: row.id, userId: target.userId, loud: true });
    return true;
  });
}

export async function sendDueReminders(now = new Date()): Promise<number> {
  const day = reminderDay(now);
  if (!day) return 0;

  let sent = 0;
  for (const t of await datedTrips(day)) {
    const kinds = remindersDue(t, day);
    if (kinds.length === 0) continue;
    const listening = new Set(await listeners(t.id));
    for (const kind of kinds) {
      const targets = kind === "still_owe" ? await debtors(t.id) : [...listening].map((userId) => ({ userId, detail: null }));
      for (const target of targets.filter((x) => listening.has(x.userId))) {
        if (await remind(kind, t.id, target)) sent += 1;
      }
    }
  }
  return sent;
}
