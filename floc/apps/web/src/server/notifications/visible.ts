/**
 * The one query both the inbox and push read notifications through, so a
 * notification hidden from the bell is never pushed either.
 */
import "server-only";

import { and, desc, eq, gte, inArray, isNotNull, isNull, ne, notInArray, or, type SQL } from "drizzle-orm";

import { db } from "@/db";
import {
  activity,
  expense,
  note,
  notification,
  settlement,
  trip,
  tripMembership,
  user,
  userProfile,
} from "@/db/schema";
import { COMMENT_KINDS, EXPENSE_KINDS, INBOX_KEEP_DAYS } from "@floc/core/notifications/rules";

export function notificationRows(where: SQL | undefined, limit: number) {
  return db
    .select({
      id: notification.id,
      userId: notification.userId,
      tripId: activity.tripId,
      kind: activity.kind,
      href: activity.href,
      detail: activity.detail,
      loud: notification.loud,
      readAt: notification.readAt,
      at: activity.lastModifiedAt,
      tripName: trip.name,
      actorName: user.name,
      actorDisplayName: userProfile.displayName,
    })
    .from(notification)
    .innerJoin(activity, eq(activity.id, notification.activityId))
    .leftJoin(trip, eq(trip.id, activity.tripId))
    .leftJoin(
      tripMembership,
      and(
        eq(tripMembership.tripId, activity.tripId),
        eq(tripMembership.userId, notification.userId),
        isNull(tripMembership.deletedAt),
      ),
    )
    .leftJoin(note, and(eq(note.id, activity.subjectId), inArray(activity.kind, COMMENT_KINDS)))
    .leftJoin(expense, and(eq(expense.id, activity.subjectId), inArray(activity.kind, EXPENSE_KINDS)))
    .leftJoin(
      settlement,
      and(eq(settlement.id, activity.subjectId), eq(activity.kind, "settlement_recorded")),
    )
    .innerJoin(user, eq(user.id, activity.actorId))
    .leftJoin(userProfile, eq(userProfile.userId, activity.actorId))
    .where(where)
    .orderBy(desc(activity.lastModifiedAt), desc(notification.id))
    .limit(limit)
    .all();
}

export function stillVisible() {
  return and(
    isNull(notification.deletedAt),
    isNull(activity.deletedAt),
    gte(activity.lastModifiedAt, new Date(Date.now() - INBOX_KEEP_DAYS * 86_400_000)),
    or(
      isNull(activity.tripId),
      and(
        isNull(trip.deletedAt),
        or(isNotNull(tripMembership.userId), eq(activity.kind, "trip_invited")),
      ),
    ),
    or(notInArray(activity.kind, COMMENT_KINDS), isNull(note.deletedAt)),
    or(notInArray(activity.kind, EXPENSE_KINDS), isNull(expense.deletedAt)),
    or(ne(activity.kind, "settlement_recorded"), isNull(settlement.deletedAt)),
  );
}
