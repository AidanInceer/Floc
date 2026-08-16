/**
 * `expense` + `expense_split` (ticket 108). Splits are snapshots (rule 2):
 * written once from the split type, never recalculated, so they survive a
 * member leaving — `writeExpense` is the only write path, rewriting the
 * expense and its whole split set in one transaction; no smaller "update
 * splits" export exists to bypass that.
 *
 * Also owns soft-delete on every read, the money tab's revalidation, and the
 * `LIMITS.expenses`/`expenseSplits` ceilings.
 *
 * Arithmetic lives in `lib/money.ts` (pure, tested) — this module only stores
 * what that computed, keeping rule 1 (money is never a float) to one seam.
 */
import "server-only";

import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { expense, expenseSplit, user, userProfile } from "@/db/schema";
import type { Currency, Expense, ExpenseSplit, SplitType } from "@/db/schema";
import { bounded, LIMITS } from "@/server/limits";
import { touch } from "@/server/audit";

export function revalidateMoney(tripId: number): void {
  revalidatePath(`/trip/${tripId}/money`);
}

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

/** One split row plus the expense context needed to decide who may settle it. */
export async function findSettleableSplit(splitId: number) {
  return db
    .select({
      id: expenseSplit.id,
      userId: expenseSplit.userId,
      settledAt: expenseSplit.settledAt,
      paidBy: expense.paidBy,
      expenseTripId: expense.tripId,
    })
    .from(expenseSplit)
    .innerJoin(expense, eq(expense.id, expenseSplit.expenseId))
    .where(and(eq(expenseSplit.id, splitId), isNull(expense.deletedAt)))
    .get();
}

/** Flips a split's settled flag — not a snapshot edit, the owed amount stays untouched; this only records money changing hands offline. */
export async function toggleSplitSettled(
  splitId: number,
  settled: boolean,
): Promise<void> {
  await db
    .update(expenseSplit)
    .set({ settledAt: settled ? new Date() : null, ...touch() })
    // Also filtered on the split's own deletedAt (ticket 115) — the read above
    // only covers a deleted expense, not a split deleted on its own.
    .where(and(eq(expenseSplit.id, splitId), isNull(expenseSplit.deletedAt)));
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
