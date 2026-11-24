import "server-only";

import { and, count, desc, eq, exists, gt, gte, inArray, isNotNull, isNull, lte, ne, notInArray, or, sql, type SQL } from "drizzle-orm";
import type { SQLiteSelect } from "drizzle-orm/sqlite-core";

import { db } from "@/db";
import {
  activity,
  bookingInbox,
  comment,
  expense,
  expenseSplit,
  friendship,
  notification,
  settlement,
  trip,
  tripInvite,
  tripMembership,
  user,
  userProfile,
  wishListMember,
} from "@/db/schema";
import { COMMENT_KINDS, EXPENSE_KINDS, INBOX_KEEP_DAYS } from "@floc/core/notifications/rules";
import { bookingInboxCutoff } from "@floc/core/documents/booking/booking-inbox";

export function notificationRows(where: SQL | undefined, limit: number) {
  return withSubjects(
    db
      .select({
        id: notification.id,
        userId: notification.userId,
        tripId: activity.tripId,
        kind: activity.kind,
        href: answeredHref(),
        detail: activity.detail,
        loud: notification.loud,
        readAt: notification.readAt,
        shareMinor: expenseSplit.owedAmountMinor,
        shareCurrency: expense.currency,
        at: activity.lastModifiedAt,
        tripName: trip.name,
        actorName: user.name,
        actorDisplayName: userProfile.displayName,
      })
      .from(notification)
      .$dynamic(),
  )
    .innerJoin(user, eq(user.id, activity.actorId))
    .leftJoin(userProfile, eq(userProfile.userId, activity.actorId))
    .where(where)
    .orderBy(desc(activity.lastModifiedAt), desc(notification.id))
    .limit(limit)
    .all();
}

export async function countNotifications(where: SQL | undefined, cap: number): Promise<number> {
  const visible = withSubjects(db.select({ id: notification.id }).from(notification).$dynamic())
    .where(where)
    .limit(cap)
    .as("visible");
  const [row] = await db.select({ n: count() }).from(visible);
  return row?.n ?? 0;
}

function withSubjects<T extends SQLiteSelect>(query: T) {
  return query
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
    .leftJoin(comment, and(eq(comment.id, activity.subjectId), inArray(activity.kind, COMMENT_KINDS)))
    .leftJoin(expense, and(eq(expense.id, activity.subjectId), inArray(activity.kind, EXPENSE_KINDS)))
    .leftJoin(
      expenseSplit,
      and(
        eq(expenseSplit.expenseId, expense.id),
        eq(expenseSplit.userId, notification.userId),
        isNull(expenseSplit.deletedAt),
      ),
    )
    .leftJoin(
      settlement,
      and(eq(settlement.id, activity.subjectId), eq(activity.kind, "settlement_recorded")),
    );
}

const pending = {
  friendRequest: db
    .select({ id: friendship.id })
    .from(friendship)
    .where(
      and(
        or(
          and(eq(friendship.userId, activity.actorId), eq(friendship.friendId, notification.userId)),
          and(eq(friendship.userId, notification.userId), eq(friendship.friendId, activity.actorId)),
        ),
        sql`coalesce(${friendship.requestedBy}, ${friendship.userId}) = ${activity.actorId}`,
        eq(friendship.status, "pending"),
        isNull(friendship.deletedAt),
      ),
    ),
  tripInvite: db
    .select({ id: tripInvite.id })
    .from(tripInvite)
    .where(
      and(
        eq(tripInvite.tripId, activity.tripId),
        eq(tripInvite.toUserId, notification.userId),
        eq(tripInvite.status, "pending"),
        isNull(tripInvite.deletedAt),
      ),
    ),
  wishListInvite: db
    .select({ id: wishListMember.id })
    .from(wishListMember)
    .where(
      and(
        eq(wishListMember.listId, activity.subjectId),
        eq(wishListMember.userId, notification.userId),
        eq(wishListMember.status, "invited"),
        isNull(wishListMember.deletedAt),
      ),
    ),
};

export const answeredHref = () =>
  sql<string | null>`case
    when ${activity.kind} = 'friend_requested' and not exists ${pending.friendRequest} then null
    when ${activity.kind} = 'trip_invited' and not exists ${pending.tripInvite} then null
    when ${activity.kind} = 'wish_list_invited' and not exists ${pending.wishListInvite} then null
    else ${activity.href} end`;

function bookingStillWaiting(now: Date) {
  return db
    .select({ id: bookingInbox.id })
    .from(bookingInbox)
    .where(
      and(
        eq(bookingInbox.userId, notification.userId),
        isNull(bookingInbox.deletedAt),
        gt(bookingInbox.createdAt, bookingInboxCutoff(now)),
        lte(bookingInbox.createdAt, activity.lastModifiedAt),
      ),
    );
}

export function stillVisible(now = new Date()) {
  return and(
    or(ne(activity.kind, "booking_waiting"), exists(bookingStillWaiting(now))),
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
    or(notInArray(activity.kind, COMMENT_KINDS), isNull(comment.deletedAt)),
    or(notInArray(activity.kind, EXPENSE_KINDS), isNull(expense.deletedAt)),
    or(notInArray(activity.kind, EXPENSE_KINDS), isNotNull(expenseSplit.id), eq(expense.paidBy, notification.userId)),
    or(ne(activity.kind, "settlement_recorded"), isNull(settlement.deletedAt)),
  );
}
