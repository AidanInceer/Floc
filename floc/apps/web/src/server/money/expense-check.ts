/**
 * The one check an expense write passes, from the web form or the phone. Who
 * it may name is the live roster plus anyone already on the expense: a former
 * member's share survives an edit, since splits are snapshots (rule 2).
 */
import "server-only";

import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { day, expense, expenseSplit } from "@/db/schema";
import { expenseProblem, type ExpenseDraft } from "@floc/core/money/expense-rules";

async function peopleOnExpense(tripId: number, expenseId: number): Promise<string[] | null> {
  const live = await db
    .select({ paidBy: expense.paidBy })
    .from(expense)
    .where(and(eq(expense.id, expenseId), eq(expense.tripId, tripId), isNull(expense.deletedAt)))
    .get();
  if (!live) return null;
  const splits = await db
    .select({ userId: expenseSplit.userId })
    .from(expenseSplit)
    .where(and(eq(expenseSplit.expenseId, expenseId), isNull(expenseSplit.deletedAt)))
    .all();
  return [live.paidBy, ...splits.map((s) => s.userId)];
}

async function isTripDay(tripId: number, dayId: number): Promise<boolean> {
  const row = await db
    .select({ id: day.id })
    .from(day)
    .where(and(eq(day.id, dayId), eq(day.tripId, tripId), isNull(day.deletedAt)))
    .get();
  return row !== undefined;
}

export async function expenseRefusal(args: {
  tripId: number;
  memberIds: string[];
  expenseId?: number;
  dayId: number | null;
  draft: ExpenseDraft;
}): Promise<string | null> {
  const people = new Set(args.memberIds);
  if (args.expenseId !== undefined) {
    const already = await peopleOnExpense(args.tripId, args.expenseId);
    if (!already) return "That expense no longer exists.";
    for (const id of already) people.add(id);
  }
  if (args.dayId !== null) {
    if (!Number.isInteger(args.dayId) || !(await isTripDay(args.tripId, args.dayId))) {
      return "That day is not on this trip.";
    }
  }
  return expenseProblem(args.draft, people);
}
