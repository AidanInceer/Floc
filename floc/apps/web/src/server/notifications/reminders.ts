/**
 * Date reminders (#346, #626): a week before, on the day, money still owed a
 * week and a month after, a year on, and the "next trip?" prompt. Written
 * straight into the inbox as loud notifications, so push and email carry
 * them — past the limits, obeying mute.
 */
import "server-only";

import { and, eq, inArray, isNull, or } from "drizzle-orm";

import { addDays } from "@floc/core/dates/dates";
import { paidIn } from "@floc/core/money/group-settle";
import { formatMoney } from "@floc/core/money/money";
import { tripHref } from "@floc/core/notifications/notification-href";
import { STILL_OWE_AFTER_DAYS, isStillOwe, reminderDay, remindersDue } from "@floc/core/notifications/reminders";
import type { ReminderKind } from "@floc/core/notifications/rules";
import { db } from "@/db";
import { trip, tripMembership, userProfile } from "@/db/schema";
import { listExpenses, listSettlements, listSplits, namesForUsers } from "@/server/money/money";
import { settleUpFrom } from "@/server/money/settle-up";
import { sendNextTripPrompts } from "@/server/notifications/next-trip";
import { remind, type Reminder, type Target } from "@/server/notifications/remind";

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
          inArray(
            trip.endDate,
            Object.values(STILL_OWE_AFTER_DAYS).map((days) => addDays(day, -days)),
          ),
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

/** Who still owes, and "Sam £40.00, Ada €12.00" for each of them: Money's payments, in the payer's currency (#463). */
async function debtors(tripId: number): Promise<Target[]> {
  const [expenses, splits, settlements] = await Promise.all([
    listExpenses(tripId),
    listSplits(tripId),
    listSettlements(tripId),
  ]);
  if (expenses.length === 0) return [];
  // Why: what a payer hands over does not depend on who looks, so any viewer will do.
  const { rows } = await settleUpFrom({ ledger: { expenses, splits, settlements }, viewerId: expenses[0].paidBy });
  const names = new Map((await namesForUsers([...new Set(rows.map((r) => r.payee))])).map((n) => [n.id, n.name]));
  const owed = new Map<string, string[]>();
  for (const row of rows) {
    const paid = paidIn(row);
    owed.set(row.payer, [...(owed.get(row.payer) ?? []), `${names.get(row.payee) ?? "someone"} ${formatMoney(paid.amountMinor, paid.currency)}`]);
  }
  return [...owed].map(([userId, parts]) => ({ userId, detail: parts.join(", ") }));
}

const tripReminder = (kind: ReminderKind, tripId: number, target: Target): Reminder => ({
  kind,
  keyTripId: tripId,
  tripId,
  href: tripHref(tripId, isStillOwe(kind) ? "money" : "overview"),
  target,
});

export async function sendDueReminders(now = new Date()): Promise<number> {
  const day = reminderDay(now);
  if (!day) return 0;

  let sent = 0;
  for (const t of await datedTrips(day)) {
    const kinds = remindersDue(t, day);
    if (kinds.length === 0) continue;
    const listening = new Set(await listeners(t.id));
    for (const kind of kinds) {
      const targets = isStillOwe(kind) ? await debtors(t.id) : [...listening].map((userId) => ({ userId, detail: null }));
      for (const target of targets.filter((x) => listening.has(x.userId))) {
        if (await remind(tripReminder(kind, t.id, target))) sent += 1;
      }
    }
  }
  return sent + (await sendNextTripPrompts(day));
}
