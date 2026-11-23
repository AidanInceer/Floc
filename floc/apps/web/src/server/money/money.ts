import "server-only";

import { and, count, desc, eq, inArray, isNull, sql, type SQL } from "drizzle-orm";

import { db } from "@/db";
import { expense, expenseSplit, settlement, user, userProfile } from "@/db/schema";
import type {
  Currency,
  Expense,
  ExpenseSplit,
  Settlement,
  SplitType,
} from "@/db/schema";
import type { ExpenseCategory } from "@floc/core/money/expense-category";
import { assertRoom, bounded, LIMITS } from "@/server/limits";
import { tripHref } from "@floc/core/notifications/notification-href";
import { touch } from "@/server/audit";
import { groupedActivityWrites, liveMemberIds, recordActivity } from "@/server/notifications/activity";
import { ledgerPages } from "./ledger-pages";

export async function listExpenses(tripId: number): Promise<Expense[]> {
  return ledgerPages((offset, size) => db
    .select()
    .from(expense)
    .where(and(eq(expense.tripId, tripId), isNull(expense.deletedAt)))
    .orderBy(desc(expense.createdAt), desc(expense.id))
    .limit(size).offset(offset)
    .all(), LIMITS.expenses);
}

export async function listSplits(tripId: number): Promise<ExpenseSplit[]> {
  const rows = await ledgerPages((offset, size) => db
    .select()
    .from(expenseSplit)
    .innerJoin(expense, eq(expense.id, expenseSplit.expenseId))
    .where(
      and(
        eq(expense.tripId, tripId),
        isNull(expense.deletedAt),
        isNull(expenseSplit.deletedAt),
      ),
    )
    .orderBy(expenseSplit.id)
    .limit(size).offset(offset)
    .all(), LIMITS.expenseSplits);
  return rows.map((r) => r.expense_split);
}

export type ExpenseFields = {
  dayId: number | null;
  paidBy: string;
  description: string;
  amountMinor: number;
  currency: Currency;
  splitType: SplitType;
  category: ExpenseCategory;
  notes: string | null;
};

export type SplitRow = { userId: string; owedAmountMinor: number };

export type ExpenseRoom = { held: number | null; members: string[] };

export async function readExpenseRoom(tripId: number, expenseId?: number): Promise<ExpenseRoom> {
  const [held, members] = await Promise.all([
    expenseId === undefined
      ? db.select({ n: count() }).from(expense).where(and(eq(expense.tripId, tripId), isNull(expense.deletedAt)))
      : null,
    liveMemberIds(db, tripId),
  ]);
  return { held: held ? held[0].n : null, members };
}

export async function writeExpense(
  args: {
    tripId: number;
    expenseId?: number;
    createdBy: string;
    fields: ExpenseFields;
    splits: SplitRow[];
  },
  room?: ExpenseRoom,
): Promise<void> {
  const { tripId, expenseId, createdBy, fields, splits } = args;
  const { held, members } = room ?? (await readExpenseRoom(tripId, expenseId));
  if (held !== null) assertRoom("expenses", held);

  const splitRows = (id: number | SQL) =>
    splits.map((s) => ({ expenseId: id, userId: s.userId, owedAmountMinor: s.owedAmountMinor }));
  const change = (subjectId: number | SQL) => ({
    tripId,
    actorId: createdBy,
    subjectId,
    href: tripHref(tripId, "money"),
    affected: splits.map((s) => s.userId),
  });

  if (expenseId !== undefined) {
    await db.batch([
      db.update(expense).set({ ...fields, ...touch() }).where(eq(expense.id, expenseId)),
      db
        .update(expenseSplit)
        .set({ deletedAt: new Date(), ...touch() })
        .where(and(eq(expenseSplit.expenseId, expenseId), isNull(expenseSplit.deletedAt))),
      db.insert(expenseSplit).values(splitRows(expenseId)),
      ...groupedActivityWrites({ kind: "expense_changed", ...change(expenseId) }, members),
    ]);
    return;
  }

  const newExpenseId = sql`(select max(${expense.id}) from ${expense} where ${expense.tripId} = ${tripId})`;
  await db.batch([
    db.insert(expense).values({ tripId, createdBy, ...fields }),
    db.insert(expenseSplit).values(splitRows(newExpenseId)),
    ...groupedActivityWrites({ kind: "expense_added", ...change(newExpenseId) }, members),
  ]);
}

export async function findLiveExpense(
  tripId: number,
  expenseId: number,
): Promise<{ id: number } | undefined> {
  return db
    .select({ id: expense.id })
    .from(expense)
    .where(
      and(
        eq(expense.id, expenseId),
        eq(expense.tripId, tripId),
        isNull(expense.deletedAt),
      ),
    )
    .get();
}

export async function softDeleteExpense(
  tripId: number,
  expenseId: number,
): Promise<void> {
  await db
    .update(expense)
    .set({ deletedAt: new Date(), ...touch() })
    .where(
      and(
        eq(expense.id, expenseId),
        eq(expense.tripId, tripId),
        isNull(expense.deletedAt),
      ),
    );
}

export async function listSettlements(tripId: number): Promise<Settlement[]> {
  return ledgerPages((offset, size) => db
    .select()
    .from(settlement)
    .where(and(eq(settlement.tripId, tripId), isNull(settlement.deletedAt)))
    .orderBy(desc(settlement.createdAt), desc(settlement.id))
    .limit(size).offset(offset)
    .all(), LIMITS.expenses);
}

export type Transfer = {
  fromUserId: string;
  toUserId: string;
  amountMinor: number;
  currency: Currency;
  clearsAmountMinor?: number;
  clearsCurrency?: Currency;
  fxRate?: number;
  fxRateDate?: string | null;
};

export async function writeSettlement(args: Transfer & { tripId: number; createdBy: string }): Promise<void> {
  const { tripId, createdBy, ...transfer } = args;
  await writeSettlements(tripId, createdBy, [transfer]);
}

export async function writeSettlements(tripId: number, createdBy: string, transfers: Transfer[]): Promise<void> {
  await db.transaction(async (tx) => {
    for (const transfer of transfers) {
      const row = await tx
        .insert(settlement)
        .values({ tripId, createdBy, ...transfer })
        .returning({ id: settlement.id })
        .get();
      await recordActivity(tx, {
        kind: "settlement_recorded",
        tripId,
        actorId: createdBy,
        subjectId: row.id,
        href: tripHref(tripId, "money"),
        affected: [transfer.fromUserId, transfer.toUserId],
      });
    }
  });
}

export async function findLiveSettlement(
  tripId: number,
  settlementId: number,
): Promise<{ id: number; fromUserId: string; toUserId: string } | undefined> {
  return db
    .select({
      id: settlement.id,
      fromUserId: settlement.fromUserId,
      toUserId: settlement.toUserId,
    })
    .from(settlement)
    .where(
      and(
        eq(settlement.id, settlementId),
        eq(settlement.tripId, tripId),
        isNull(settlement.deletedAt),
      ),
    )
    .get();
}

export async function rewriteSettlement(
  tripId: number,
  settlementId: number,
  transfer: Transfer,
): Promise<boolean> {
  const rows = await db
    .update(settlement)
    .set({
      clearsAmountMinor: null,
      clearsCurrency: null,
      fxRate: null,
      fxRateDate: null,
      ...transfer,
      ...touch(),
    })
    .where(
      and(
        eq(settlement.id, settlementId),
        eq(settlement.tripId, tripId),
        isNull(settlement.deletedAt),
      ),
    )
    .returning({ id: settlement.id });
  return rows.length > 0;
}

export async function softDeleteSettlement(
  tripId: number,
  settlementId: number,
): Promise<void> {
  await db
    .update(settlement)
    .set({ deletedAt: new Date(), ...touch() })
    .where(
      and(
        eq(settlement.id, settlementId),
        eq(settlement.tripId, tripId),
        isNull(settlement.deletedAt),
      ),
    );
}

export async function namesForUsers(
  userIds: string[],
): Promise<{ id: string; name: string }[]> {
  if (userIds.length === 0) return [];
  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      displayName: userProfile.displayName,
    })
    .from(user)
    .leftJoin(userProfile, eq(userProfile.userId, user.id))
    .where(inArray(user.id, userIds))
    .limit(LIMITS.members)
    .all();
  return bounded(rows, "members", "expense participants").map((r) => ({
    id: r.id,
    name: r.displayName ?? r.name,
  }));
}
