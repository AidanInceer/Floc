import type { Currency } from "../currency";
import type { ExpenseCategory } from "../expense-category";
import { convertMinor } from "../money";
import { lineOfCategory, type SpendLine } from "./lines";

type Expense = { id: number; category: ExpenseCategory; currency: Currency };
type Split = { expenseId: number; userId: string; owedAmountMinor: number };

export type Spent = { byLine: Record<SpendLine, number>; total: number; unconverted: boolean };

export function spentByLine(args: {
  expenses: Expense[];
  splits: Split[];
  viewerId: string;
  home: Currency;
  toHome: Partial<Record<Currency, number>>;
}): Spent {
  const byLine: Record<SpendLine, number> = { flights: 0, stay: 0, food: 0, activities: 0, transport: 0, other: 0 };
  const expenses = new Map(args.expenses.map((e) => [e.id, e]));
  let unconverted = false;
  for (const s of args.splits) {
    const e = s.userId === args.viewerId ? expenses.get(s.expenseId) : undefined;
    if (!e) continue;
    const rate = e.currency === args.home ? 1 : args.toHome[e.currency];
    if (!rate) {
      unconverted = true;
      continue;
    }
    byLine[lineOfCategory(e.category)] += convertMinor(s.owedAmountMinor, e.currency, args.home, rate);
  }
  const total = Object.values(byLine).reduce((a, b) => a + b, 0);
  return { byLine, total, unconverted };
}
