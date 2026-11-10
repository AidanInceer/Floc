/** The money half of the port (#573). The rules it carries are listed in `../port.ts`. */
import type { Currency } from "@floc/core/money/currency";
import type { ExpenseCategory } from "@floc/core/money/expense-category";
import type { SettleRow } from "@floc/core/money/group-settle";
import type { SplitType } from "@floc/core/vocabulary";

export type Expense = {
  id: number;
  description: string;
  /** Integer minor units (rule 1). A client that divides this by 100 for display is fine; one that stores the result is not. */
  amountMinor: number;
  currency: Currency;
  category: ExpenseCategory;
  splitType: SplitType;
  paidBy: string;
  /** The itinerary day it is filed under, if any — never a timestamp (rule 10). */
  dayId: number | null;
  notes: string | null;
};

/** A snapshot, written once with its expense and never recalculated (rule 2). */
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
  /** Cross-currency only (ticket 253): the debt this payment cleared, which is what moves the balance. */
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
  /** The whole split set, written in one transaction with the expense (rule 2). */
  splits: { userId: string; owedAmountMinor: number }[];
};

export type MoneyPort = {
  loadLedger(viewerId: string, tripId: number): Promise<Ledger>;

  /** The group's fewest payments across currencies, each in the viewer's home currency (#463). */
  loadPairs(viewerId: string, tripId: number): Promise<SettleUp>;

  /** Rewrites the expense and its whole split set in one transaction (rule 2). */
  writeExpense(
    viewerId: string,
    tripId: number,
    input: ExpenseInput & { expenseId?: number | undefined },
  ): Promise<void>;

  deleteExpense(viewerId: string, tripId: number, expenseId: number): Promise<void>;

  /** Records the viewer's one payment with one person, recomputed server-side (#461, #463). */
  settlePair(viewerId: string, tripId: number, otherUserId: string): Promise<void>;

  /**
   * Records a transfer that has already happened off-app (ticket 300).
   * A party to it can correct or undo it on the web (#361); the phone has no
   * list of settlements to do either from. v1 moves no money — this writes down that somebody did. All transfers
   * save together or none do.
   */
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
