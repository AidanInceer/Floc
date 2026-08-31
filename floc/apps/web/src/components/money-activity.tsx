/**
 * The money tab's activity feed — every expense and settlement, newest first,
 * each deletable to revert it (split out of page.tsx at ticket 253, which took
 * the page past its line ceiling). Reads data, never fetches: the page owns
 * every query.
 */
import type { Currency, Expense, ExpenseSplit, Settlement } from "@/db/schema";
import { formatDate, toIsoDate } from "@/lib/dates";
import { formatTicker } from "@/lib/money";
import { menuDangerItemClass, menuItemClass } from "@/components/ui";
import { ConfirmSubmit, Menu, Sheet } from "@/components/client-ui";
import { CategoryIcon } from "@/components/category-icon";
import { ConvertAmount } from "@/components/money-client";
import { ExpenseForm } from "@/components/expense-form";
import type { FormDay, FormMember } from "@/components/expense-form";
import {
  deleteExpense,
  deleteSettlement,
  updateExpense,
} from "@/app/trip/[id]/money/actions";


// Even split is stored as one share each; read it back from the numbers
// (within a penny, for remainder handling) rather than trusting splitType.
const SPLIT_LABELS: Record<Expense["splitType"], string> = {
  even: "split evenly",
  exact: "set amounts",
  percentage: "by percentage",
  shares: "by shares",
};

function splitLabel(e: Expense, splits: { owedAmountMinor: number }[]): string {
  if (splits.length === 1) return "all on one person";
  if (splits.length > 1 && (e.splitType === "shares" || e.splitType === "even")) {
    const min = Math.min(...splits.map((s) => s.owedAmountMinor));
    const max = Math.max(...splits.map((s) => s.owedAmountMinor));
    if (max - min <= 1) return SPLIT_LABELS.even;
  }
  return SPLIT_LABELS[e.splitType];
}

type FeedItem =
  | { kind: "expense"; at: Date; expense: Expense }
  | { kind: "settlement"; at: Date; settlement: Settlement };

export function ActivityFeed(props: {
  collapsed: boolean;
  tripId: number;
  viewerId: string;
  expenses: Expense[];
  settlements: Settlement[];
  splitsByExpense: Map<number, ExpenseSplit[]>;
  dayById: Map<number, { date: string }>;
  name: (userId: string) => string;
  label: (userId: string) => string;
  tone: (userId: string) => string | undefined;
  home: Currency;
  rateFor: (currency: Currency) => number | null;
  formMembers: FormMember[];
  formDays: FormDay[];
  homeCurrency: Currency;
}) {
  const items: FeedItem[] = [
    ...props.expenses.map((e): FeedItem => ({ kind: "expense", at: e.createdAt, expense: e })),
    ...props.settlements.map(
      (s): FeedItem => ({ kind: "settlement", at: s.createdAt, settlement: s }),
    ),
  ].sort((a, b) => b.at.getTime() - a.at.getTime());

  const rows = (
    <ul className="mt-2 flex flex-col">
      {items.map((item) =>
        item.kind === "expense" ? (
          <ExpenseRow key={`e${item.expense.id}`} {...props} expense={item.expense} />
        ) : (
          <SettlementRow key={`s${item.settlement.id}`} {...props} settlement={item.settlement} />
        ),
      )}
    </ul>
  );

  if (props.collapsed) {
    return (
      <details className="rounded-lg bg-sheet p-6">
        <summary className="flex cursor-pointer list-none items-center justify-center gap-2 text-sm font-semibold text-ink-soft [&::-webkit-details-marker]:hidden">
          Past activity
          <svg
            width={14}
            height={14}
            viewBox="0 0 14 14"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.4}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M3.5 5.2L7 8.7l3.5-3.5" />
          </svg>
        </summary>
        {rows}
      </details>
    );
  }

  return (
    <section className="rounded-lg bg-sheet p-6">
      <h2 className="border-b border-rule pb-3 text-xl">Activity</h2>
      {rows}
    </section>
  );
}

function ExpenseRow({
  tripId,
  viewerId,
  expense: e,
  splitsByExpense,
  dayById,
  name,
  home,
  rateFor,
  formMembers,
  formDays,
  homeCurrency,
}: {
  tripId: number;
  viewerId: string;
  expense: Expense;
  splitsByExpense: Map<number, ExpenseSplit[]>;
  dayById: Map<number, { date: string }>;
  name: (userId: string) => string;
  home: Currency;
  rateFor: (currency: Currency) => number | null;
  formMembers: FormMember[];
  formDays: FormDay[];
  homeCurrency: Currency;
}) {
  const rowSplits = splitsByExpense.get(e.id) ?? [];
  const d = e.dayId ? dayById.get(e.dayId) : null;
  const payer = e.paidBy === viewerId ? "You" : name(e.paidBy);

  return (
    <li className="flex items-center gap-3 border-b border-rule py-3 last:border-b-0">
      <span className="flex h-9 w-9 flex-none items-center justify-center rounded-md border border-rule bg-sheet-2 text-ink-soft">
        <CategoryIcon category={e.category} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{e.description}</p>
        <p className="mt-0.5 truncate text-xs text-ink-soft">
          {payer} paid · {splitLabel(e, rowSplits)}
          {d ? ` · ${formatDate(d.date)}` : ""}
        </p>
      </div>
      <div className="flex items-center gap-1.5">
        <ConvertAmount
          amountMinor={e.amountMinor}
          currency={e.currency}
          home={home}
          rate={rateFor(e.currency)}
          className="nums text-sm font-medium"
        />
        <Menu label={`Actions for ${e.description}`}>
          <Sheet
            trigger="Edit"
            title="Expense"
            triggerVariant="ghost"
            triggerClassName={menuItemClass}
            keepOpenOnSubmit
          >
            <ExpenseForm
              tripId={tripId}
              members={formMembers}
              days={formDays}
              homeCurrency={homeCurrency}
              viewerId={viewerId}
              action={updateExpense}
              expense={{
                id: e.id,
                description: e.description,
                amountMinor: e.amountMinor,
                currency: e.currency,
                splitType: e.splitType,
                category: e.category,
                paidBy: e.paidBy,
                dayId: e.dayId,
                notes: e.notes,
                splits: rowSplits.map((s) => ({
                  userId: s.userId,
                  owedAmountMinor: s.owedAmountMinor,
                })),
              }}
            />
          </Sheet>
          <form action={deleteExpense}>
            <input type="hidden" name="tripId" value={tripId} />
            <input type="hidden" name="expenseId" value={e.id} />
            <ConfirmSubmit
              message={`Delete "${e.description}"?`}
              variant="ghost"
              className={menuDangerItemClass}
            >
              Delete
            </ConfirmSubmit>
          </form>
        </Menu>
      </div>
    </li>
  );
}

function SettlementRow({
  tripId,
  settlement: s,
  label,
  home,
  rateFor,
}: {
  tripId: number;
  settlement: Settlement;
  label: (userId: string) => string;
  home: Currency;
  rateFor: (currency: Currency) => number | null;
}) {
  return (
    <li className="flex items-center gap-3 border-b border-rule py-3 last:border-b-0">
      <span className="flex h-9 w-9 flex-none items-center justify-center rounded-md border border-mint-edge bg-mint text-mint-ink">
        <svg
          width={18}
          height={18}
          viewBox="0 0 14 14"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M2 4.5h8L8.2 2.7M12 9.5H4l1.8 1.8" />
        </svg>
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">
          {label(s.fromUserId)} paid {label(s.toUserId)}
        </p>
        <p className="mt-0.5 truncate text-xs text-ink-soft">
          {s.clearsCurrency && s.clearsAmountMinor !== null
            ? `Cash · cleared ${formatTicker(s.clearsAmountMinor, s.clearsCurrency)} at ${s.fxRate?.toFixed(4)}${s.fxRateDate ? `, ${formatDate(s.fxRateDate)}` : ""}`
            : `Cash · ${formatDate(toIsoDate(s.createdAt))}`}
        </p>
      </div>
      <div className="flex items-center gap-1.5">
        <ConvertAmount
          amountMinor={s.amountMinor}
          currency={s.currency}
          home={home}
          rate={rateFor(s.currency)}
          className="nums text-sm font-medium text-mint-ink"
        />
        <form action={deleteSettlement}>
          <input type="hidden" name="tripId" value={tripId} />
          <input type="hidden" name="settlementId" value={s.id} />
          <ConfirmSubmit
            message="Undo this settlement? The balances go back to before it."
            variant="ghost"
            className={menuDangerItemClass}
            label="Undo settlement"
          >
            Undo
          </ConfirmSubmit>
        </form>
      </div>
    </li>
  );
}
