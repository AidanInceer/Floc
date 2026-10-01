/**
 * Writing money, from the web form or the phone: access is already resolved by
 * the door, and everything after it happens here once. Each write returns
 * the refusal that says why not, or null once it has written and refreshed.
 */
import "server-only";

import {
  expenseFieldsProblem,
  transferPartiesProblem,
} from "@floc/core/money/expense-rules";
import { Refusal } from "@floc/core/errors/refusal";
import type { Currency } from "@floc/core/money/currency";
import type { ExpenseCategory } from "@floc/core/money/expense-category";

import type { TripAccess } from "@/server/access";
import { refresh } from "@/server/freshness";
import { expenseRefusal } from "@/server/money/expense-check";
import {
  softDeleteExpense,
  writeExpense,
  writeSettlements,
  type ExpenseFields,
  type SplitRow,
  type Transfer,
} from "@/server/money/money";

type Access = Pick<TripAccess, "trip" | "members" | "viewer">;

export type ExpenseSave = {
  expenseId?: number;
  description: string;
  amountMinor: number;
  currency: Currency;
  category: ExpenseCategory;
  splitType: ExpenseFields["splitType"];
  paidBy: string;
  dayId: number | null;
  notes: string | null;
  splits: SplitRow[];
};

/** Add or edit: an edit rewrites the expense and its whole split set in one transaction (rule 2). */
export async function saveExpense(access: Access, input: ExpenseSave): Promise<Refusal | null> {
  const { expenseId, splits, ...fields } = input;
  const problem =
    expenseFieldsProblem(fields) ??
    (await expenseRefusal({
      tripId: access.trip.id,
      memberIds: access.members.map((m) => m.userId),
      expenseId,
      dayId: fields.dayId,
      draft: { paidBy: fields.paidBy, amountMinor: fields.amountMinor, currency: fields.currency, splits },
    }));
  if (problem) return new Refusal(problem);

  await writeExpense({ tripId: access.trip.id, expenseId, createdBy: access.viewer.id, fields, splits });
  refresh({ kind: "money", tripId: access.trip.id });
  return null;
}

export async function removeExpense(access: Access, expenseId: number): Promise<void> {
  await softDeleteExpense(access.trip.id, expenseId);
  refresh({ kind: "money", tripId: access.trip.id });
}

/** Any member on either side may record a settlement; all transfers in one transaction (#345). */
export async function recordTransfers(access: Access, transfers: Transfer[]): Promise<Refusal | null> {
  const people = new Set(access.members.map((m) => m.userId));
  for (const t of transfers) {
    const problem = transferPartiesProblem(people, access.viewer.id, t.fromUserId, t.toUserId);
    if (problem) return problem;
  }
  await writeSettlements(access.trip.id, access.viewer.id, transfers);
  refresh({ kind: "money", tripId: access.trip.id });
  return null;
}
