/** Writes one reminder into the inbox, once per (kind, trip, person) (#346, #626). */
import "server-only";

import type { ReminderKind } from "@floc/core/notifications/rules";
import { db } from "@/db";
import { activity, notification, reminder } from "@/db/schema";

export type Target = { userId: string; detail: string | null };

export type Reminder = {
  kind: ReminderKind;
  /** The trip the once-only key is claimed against. */
  keyTripId: number;
  /** The trip the row is about — null for a prompt about the person, which trip mute must not hold back (ADR-056). */
  tripId: number | null;
  href: string;
  target: Target;
};

/** Why: the reminder row's unique key is claimed first, so an overlapping run inserts nothing twice. The actor is the recipient because a date has no author. */
export async function remind({ kind, keyTripId, tripId, href, target }: Reminder): Promise<boolean> {
  return db.transaction(async (tx) => {
    const won = await tx
      .insert(reminder)
      .values({ kind, tripId: keyTripId, userId: target.userId })
      .onConflictDoNothing()
      .returning({ id: reminder.id })
      .all();
    if (won.length === 0) return false;
    const row = await tx
      .insert(activity)
      .values({ kind, tripId, actorId: target.userId, subjectId: tripId, href, detail: target.detail })
      .returning({ id: activity.id })
      .get();
    await tx.insert(notification).values({ activityId: row.id, userId: target.userId, loud: true });
    return true;
  });
}
