/**
 * `expense` + `expense_split` (ticket 108). Splits are snapshots (rule 2):
 * written once from the split type, never recalculated, so they survive a
 * member leaving — `writeExpense` is the only write path, rewriting the
 * expense and its whole split set in one transaction; no smaller "update
 * splits" export exists to bypass that.
 *
 * Also owns soft-delete on every read and the `LIMITS.expenses` /
 * `expenseSplits` ceilings.
 *
 * Arithmetic lives in `lib/money.ts` (pure, tested) — this module only stores
 * what that computed, keeping rule 1 (money is never a float) to one seam.
 */
import "server-only";

import { and, desc, eq, inArray, isNull } from "drizzle-orm";

import { db } from "@/db";
import { expense, expenseSplit, settlement, user, userProfile } from "@/db/schema";
import type {
  Currency,
  Expense,
  ExpenseSplit,
  Settlement,
  SplitType,
} from "@/db/schema";
import type { ExpenseCategory } from "@/lib/expense-category";
import { bounded, LIMITS } from "@/server/limits";
import { touch } from "@/server/audit";

/** The trip's live ledger, newest first (ticket 118). Whole rows — Money and Overview both read columns from it. */
export async function listExpenses(tripId: number): Promise<Expense[]> {
  const rows = await db
    .select()
    .from(expense)
    .where(and(eq(expense.tripId, tripId), isNull(expense.deletedAt)))
    .orderBy(desc(expense.createdAt))
    .limit(LIMITS.expenses)
    .all();
  return bounded(rows, "expenses", `trip ${tripId}`);
}

/**
 * Every live split on the trip's live expenses (ticket 118). Scoped by joining
 * back to `expense` on `trip_id` rather than an `inArray` over `listExpenses`'
 * ids, which also restores rule 8 on the child rows — a split under a deleted
 * expense used to still count into the balances.
 */
export async function listSplits(tripId: number): Promise<ExpenseSplit[]> {
  const rows = await db
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
    .limit(LIMITS.expenseSplits)
    .all();
  return bounded(
    rows.map((r) => r.expense_split),
    "expenseSplits",
    `trip ${tripId}`,
  );
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

/**
 * Writes an expense and its complete split set in one transaction. Pass
 * `expenseId` to replace, or omit to create. On update, old split rows are
 * deleted and new ones inserted in the same transaction — rule 7
 * (last-write-wins) applied to a parent with children.
 */
export async function writeExpense(args: {
  tripId: number;
  expenseId?: number;
  createdBy: string;
  fields: ExpenseFields;
  splits: SplitRow[];
}): Promise<void> {
  const { tripId, expenseId, createdBy, fields, splits } = args;

  await db.transaction(async (tx) => {
    let id = expenseId;

    if (id === undefined) {
      const [row] = await tx
        .insert(expense)
        .values({ tripId, createdBy, ...fields })
        .returning({ id: expense.id });
      id = row.id;
    } else {
      await tx
        .update(expense)
        .set({ ...fields, ...touch() })
        .where(eq(expense.id, id));
      await tx.delete(expenseSplit).where(eq(expenseSplit.expenseId, id));
    }

    await tx.insert(expenseSplit).values(
      splits.map((s) => ({
        expenseId: id!,
        userId: s.userId,
        owedAmountMinor: s.owedAmountMinor,
      })),
    );
  });
}

/** Confirms an expense is this trip's and still live, before an edit. */
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

/** Soft-deletes an expense; splits are left as-is — the parent's `deletedAt` hides them on read (ticket 16), and rewriting a snapshot isn't allowed. */
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
        isNull(expense.deletedAt), // second delete is a no-op, not a re-stamp (ticket 115)
      ),
    );
}

/** The trip's live settlements, newest first (money overhaul). */
export async function listSettlements(tripId: number): Promise<Settlement[]> {
  const rows = await db
    .select()
    .from(settlement)
    .where(and(eq(settlement.tripId, tripId), isNull(settlement.deletedAt)))
    .orderBy(desc(settlement.createdAt))
    .limit(LIMITS.expenses)
    .all();
  return bounded(rows, "expenses", `trip ${tripId} settlements`);
}

/** Records one transfer that has already happened off-app. Append-only — never edited, reverted by soft-delete. */
export async function writeSettlement(args: {
  tripId: number;
  createdBy: string;
  fromUserId: string;
  toUserId: string;
  amountMinor: number;
  currency: Currency;
}): Promise<void> {
  await db.insert(settlement).values(args);
}

/** Confirms a settlement is this trip's and still live, before reverting it. */
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

/** Soft-deletes a settlement — the revert; the balance recomputes as if the money never moved. */
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

/** Display names for split participants the roster can't name — a former member whose split rows survive by design (ticket 04, moved off the page by ticket 118). */
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

/** Same former-member case as `namesForUsers`, for the mail rather than the ledger. */
export async function emailsForUsers(
  userIds: string[],
): Promise<{ id: string; email: string }[]> {
  if (userIds.length === 0) return [];
  const rows = await db
    .select({ id: user.id, email: user.email })
    .from(user)
    .where(inArray(user.id, userIds))
    .limit(LIMITS.members)
    .all();
  return bounded(rows, "members", "expense participants");
}
