import type { Currency } from "@floc/core/money/currency";
import type { ExpenseCategory } from "@floc/core/money/expense-category";
import type { SettleRow } from "@floc/core/money/group-settle";
import type { SplitType } from "@floc/core/vocabulary";

export type Expense = {
  id: number;
  description: string;
  amountMinor: number;
  currency: Currency;
  category: ExpenseCategory;
  splitType: SplitType;
  paidBy: string;
  dayId: number | null;
  notes: string | null;
};

export type ExpenseSplit = {
  expenseId: number;
  userId: string;
  owedAmountMinor: number;
};

export type Settlement = {
  id: number;
  fromUserId: string;
  toUserId: string;
  amountMinor: number;
  currency: Currency;
  clearsAmountMinor: number | null;
  clearsCurrency: Currency | null;
};

export type SettleUp = { rows: SettleRow[]; rateDate: string | null };

export type Ledger = {
  expenses: Expense[];
  splits: ExpenseSplit[];
  settlements: Settlement[];
};

export type ExpenseInput = {
  description: string;
  amountMinor: number;
  currency: Currency;
  category: ExpenseCategory;
  splitType: SplitType;
  paidBy: string;
  dayId: number | null;
  notes: string | null;
  splits: { userId: string; owedAmountMinor: number }[];
};

export type MoneyPort = {
  loadLedger(viewerId: string, tripId: number): Promise<Ledger>;

  loadPairs(viewerId: string, tripId: number): Promise<SettleUp>;

  writeExpense(
    viewerId: string,
    tripId: number,
    input: ExpenseInput & { expenseId?: number | undefined },
  ): Promise<void>;

  deleteExpense(viewerId: string, tripId: number, expenseId: number): Promise<void>;

  settlePair(viewerId: string, tripId: number, otherUserId: string): Promise<void>;

  settleUp(
    viewerId: string,
    tripId: number,
    transfers: {
      fromUserId: string;
      toUserId: string;
      amountMinor: number;
      currency: Currency;
    }[],
  ): Promise<void>;
};
