/**
 * The money aggregate — `expense` and `expense_split` (ticket 108).
 *
 * The one rule worth the module on its own: **`expense_split` rows are
 * snapshots** (non-negotiable 2). They are written once from the split type and
 * never recalculated, so they survive the member they belong to leaving the
 * trip — and an edit therefore rewrites the expense *and its whole split set*
 * in a single transaction, never a partial-row merge. Before this module that
 * sequence was typed out twice, in `addExpense` and `updateExpense`, and there
 * was nothing stopping a third caller writing a split on its own.
 *
 * `writeExpense` below is the only way in. There is deliberately no exported
 * "update the splits" or "insert a split": the snapshot rule is enforced by
 * there being no smaller operation to reach for.
 *
 * Also owned here: soft-delete on every read (rule 8), the money tab's
 * revalidation, and the ceilings. `listExpenses` and `listSplits` (ticket 118)
 * are where `LIMITS.expenses` and `LIMITS.expenseSplits` finally take effect;
 * Money and Overview both read them, which is why they are two reads here and
 * not one `loadMoneyTab()` on the page. See `server/ideas.ts` for the seam.
 *
 * The arithmetic is *not* here — it is `lib/money.ts`, which is pure and
 * tested. This module stores what that module computed and nothing else, so
 * non-negotiable 1 (money is never a float) has exactly one home either side of
 * the seam: `computeSplits` decides the numbers, integer minor units carry them.
 */
import "server-only";

import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { expense, expenseSplit, user, userProfile } from "@/db/schema";
import type { Currency, Expense, ExpenseSplit, SplitType } from "@/db/schema";
import { bounded, LIMITS } from "@/server/limits";
import { touch } from "@/server/unlocks";

export function revalidateMoney(tripId: number): void {
  revalidatePath(`/trip/${tripId}/money`);
}

/**
 * The trip's live ledger, newest first (ticket 118). Whole rows: Money renders
 * every column and Overview reads four of them, and a second narrower query
 * would buy a handful of bytes for a second query's worth of complexity.
 */
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
 * Every live split on the trip's live expenses (ticket 118).
 *
 * Scoped by joining back to `expense` on `trip_id`, not by an `inArray` over
 * ids `listExpenses` returns — so a caller fires both together. The join is
 * also what restores rule 8 on the child rows: without it a split belonging to
 * a deleted expense still counted into the balances.
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
  // A join hands back `{ expense_split, expense }` per row; only the split is
  // anyone's business out here.
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
 * Writes an expense and its complete split set in one transaction.
 *
 * Pass `expenseId` to replace an existing expense, or omit it to create one.
 * Either way the split set is written whole — on an update the old rows are
 * deleted and the new ones inserted inside the same transaction, which is what
 * "last-write-wins on the whole expense" (rule 7) means for a parent with
 * children. A split has no independent life; it is part of the expense's value.
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

/**
 * Soft-deletes an expense. Its splits are left exactly as they are: reads join
 * through the expense, so the parent's `deletedAt` hides them (ticket 16), and
 * rewriting the children would be editing a snapshot.
 */
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
        // A second delete is a no-op, not a re-stamp (ticket 115).
        isNull(expense.deletedAt),
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

/**
 * Flips a split's settled flag. Settling is not a snapshot edit — the owed
 * amount is untouched; this only records that the money changed hands offline.
 */
export async function toggleSplitSettled(
  splitId: number,
  settled: boolean,
): Promise<void> {
  await db
    .update(expenseSplit)
    .set({ settledAt: settled ? new Date() : null, ...touch() })
    // Filtered on the split's own `deletedAt` as well (ticket 115). The read
    // above joins the expense, so a deleted *expense* was already covered; a
    // split deleted on its own was not.
    .where(and(eq(expenseSplit.id, splitId), isNull(expenseSplit.deletedAt)));
}

/**
 * Email addresses for split participants who aren't on the trip's roster any
 * more — kicked or left since the expense was written, whose split rows survive
 * by design. Bounded by the split ceiling because the caller's list is.
 */
/**
 * Display names for split participants the roster can't name — the same
 * former-member case as `emailsForUsers`, for the ledger rather than the mail
 * (ticket 04, moved off the page by ticket 118).
 */
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
