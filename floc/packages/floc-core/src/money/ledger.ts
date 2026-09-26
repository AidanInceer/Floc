/**
 * A trip's ledger rows → balances. The one assembly every screen uses, so the
 * cross-currency fields (ticket 253) cannot be dropped by one of them again.
 */
import type { Currency } from "./currency";
import { computeBalances, type Balances } from "./money";

export type LedgerRows = {
  expenses: readonly { id: number; paidBy: string; currency: Currency; amountMinor: number }[];
  splits: readonly { expenseId: number; userId: string; owedAmountMinor: number }[];
  settlements: readonly {
    fromUserId: string;
    toUserId: string;
    currency: Currency;
    amountMinor: number;
    clearsCurrency?: Currency | null;
    clearsAmountMinor?: number | null;
  }[];
};

export function ledgerBalances(ledger: LedgerRows): Balances {
  const byExpense = new Map<number, { userId: string; owedAmountMinor: number }[]>();
  for (const split of ledger.splits) {
    const list = byExpense.get(split.expenseId);
    const row = { userId: split.userId, owedAmountMinor: split.owedAmountMinor };
    if (list) list.push(row);
    else byExpense.set(split.expenseId, [row]);
  }

  return computeBalances(
    ledger.expenses.map((expense) => ({
      paidBy: expense.paidBy,
      currency: expense.currency,
      amountMinor: expense.amountMinor,
      splits: byExpense.get(expense.id) ?? [],
    })),
    ledger.settlements.map((settlement) => ({
      from: settlement.fromUserId,
      to: settlement.toUserId,
      currency: settlement.currency,
      amountMinor: settlement.amountMinor,
      clearsCurrency: settlement.clearsCurrency ?? null,
      clearsAmountMinor: settlement.clearsAmountMinor ?? null,
    })),
  );
}
