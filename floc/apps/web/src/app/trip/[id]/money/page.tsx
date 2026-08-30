/**
 * Money tab (ticket 16; re-modelled by the money overhaul). Splitwise-shaped:
 * balances are derived at read time from expenses − settlements (rule 04,
 * `computeBalances`), the page shows only the *simplified* transfers that
 * square everyone up, and a merged activity feed of expenses and settlements
 * that any member can delete to revert. When every book nets to zero the whole
 * tab collapses behind a "settled up" banner.
 */
import type { Currency, Expense, ExpenseSplit, Settlement } from "@/db/schema";
import { CURRENCIES } from "@/db/schema";
import { requireTripAccess } from "@/server/access";
import { formatDate, toIsoDate } from "@/lib/dates";
import {
  computeBalances,
  isAllSettled,
  suggestSettlements,
} from "@/lib/money";
import type { LedgerLine, LedgerSettlement } from "@/lib/money";
import { listDays } from "@/server/itinerary";
import {
  listExpenses,
  listSettlements,
  listSplits,
  namesForUsers,
} from "@/server/money";
import { getProfile } from "@/server/profile";
import { getHomeRates } from "@/server/fx";
import { Avatar, cx, menuDangerItemClass, menuItemClass } from "@/components/ui";
import { ConfirmSubmit, Menu, Sheet } from "@/components/client-ui";
import { CategoryIcon } from "@/components/category-icon";
import { ConvertAmount, SettleUpForm } from "@/components/money-client";
import { ExpenseForm } from "@/components/expense-form";
import type { FormDay, FormMember } from "@/components/expense-form";
import {
  addExpense,
  deleteExpense,
  deleteSettlement,
  recordSettlement,
  updateExpense,
} from "./actions";

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

export default async function MoneyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const access = await requireTripAccess(id, `/trip/${id}/money`);
  const tripId = access.trip.id;
  const viewerId = access.viewer.id;

  const [expenses, days, viewerProfile, splits, settlements] = await Promise.all(
    [
      listExpenses(tripId),
      listDays(tripId),
      getProfile(viewerId),
      listSplits(tripId),
      listSettlements(tripId),
    ],
  );

  const homeCurrency: Currency = viewerProfile?.homeCurrency ?? "GBP";
  const rates = await getHomeRates(homeCurrency);
  const rateFor = (currency: Currency): number | null =>
    rates ? rates.toHome[currency] || null : null;

  // A participant may have since left the trip, so names need a direct lookup,
  // not just the current member list (ticket 04).
  const knownIds = new Set(access.members.map((m) => m.userId));
  const extraIds = new Set<string>();
  for (const s of splits) if (!knownIds.has(s.userId)) extraIds.add(s.userId);
  for (const e of expenses) if (!knownIds.has(e.paidBy)) extraIds.add(e.paidBy);
  for (const s of settlements) {
    if (!knownIds.has(s.fromUserId)) extraIds.add(s.fromUserId);
    if (!knownIds.has(s.toUserId)) extraIds.add(s.toUserId);
  }
  const extraUsers = await namesForUsers([...extraIds]);

  const userNames: Record<string, string> = {};
  for (const m of access.members) userNames[m.userId] = m.name;
  for (const u of extraUsers) userNames[u.id] = u.name;
  const name = (userId: string) => userNames[userId] ?? "Former member";
  const label = (userId: string) => (userId === viewerId ? "You" : name(userId));

  const memberTones: Record<string, string> = {};
  for (const m of access.members) memberTones[m.userId] = m.tone;
  const tone = (userId: string) => memberTones[userId];

  const splitsByExpense = new Map<number, ExpenseSplit[]>();
  for (const s of splits) {
    const list = splitsByExpense.get(s.expenseId) ?? [];
    list.push(s);
    splitsByExpense.set(s.expenseId, list);
  }

  const dayById = new Map(days.map((d) => [d.id, d]));

  const ledgerLines: LedgerLine[] = expenses.map((e) => ({
    paidBy: e.paidBy,
    currency: e.currency,
    amountMinor: e.amountMinor,
    splits: (splitsByExpense.get(e.id) ?? []).map((s) => ({
      userId: s.userId,
      owedAmountMinor: s.owedAmountMinor,
    })),
  }));
  const ledgerSettlements: LedgerSettlement[] = settlements.map((s) => ({
    from: s.fromUserId,
    to: s.toUserId,
    currency: s.currency,
    amountMinor: s.amountMinor,
  }));

  const balances = computeBalances(ledgerLines, ledgerSettlements);
  const active = CURRENCIES.filter((c) => Object.keys(balances[c]).length > 0);

  const formMembers: FormMember[] = access.members.map((m) => ({
    userId: m.userId,
    name: m.name,
  }));
  const formDays: FormDay[] = days.map((d) => ({
    id: d.id,
    date: d.date,
    label: formatDate(d.date),
  }));

  const addForm = (
    <ExpenseForm
      tripId={tripId}
      members={formMembers}
      days={formDays}
      homeCurrency={homeCurrency}
      viewerId={viewerId}
      action={addExpense}
    />
  );

  const hasActivity = expenses.length > 0 || settlements.length > 0;
  const allSettled = hasActivity && isAllSettled(balances);

  // Every transfer that squares the group up, across currencies, viewer's own
  // first — those are theirs to act on (the page's one blue).
  const transfers = active
    .flatMap((currency) =>
      suggestSettlements(balances[currency]).map((s) => ({ ...s, currency })),
    )
    .sort((a, b) => {
      const aMine = a.from === viewerId ? 0 : 1;
      const bMine = b.from === viewerId ? 0 : 1;
      return aMine - bMine;
    });

  return (
    <div className="mx-auto w-full max-w-[64rem] px-4 pb-20 pt-6 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <h1 className="text-[clamp(1.9rem,4vw,2.8rem)]">Money</h1>
        {hasActivity ? (
          <Sheet trigger="Add expense" title="Expense" keepOpenOnSubmit>
            {addForm}
          </Sheet>
        ) : null}
      </header>

      {!hasActivity ? (
        <EmptyMoney addForm={addForm} />
      ) : (
        <div className="mt-8 flex flex-col gap-4">
          {allSettled ? (
            <SettledBanner addForm={addForm} />
          ) : (
            <SettleUpCard
              tripId={tripId}
              transfers={transfers}
              viewerId={viewerId}
              label={label}
              tone={tone}
              home={homeCurrency}
              rateFor={rateFor}
            />
          )}

          <ActivityFeed
            collapsed={allSettled}
            tripId={tripId}
            viewerId={viewerId}
            expenses={expenses}
            settlements={settlements}
            splitsByExpense={splitsByExpense}
            dayById={dayById}
            name={name}
            label={label}
            tone={tone}
            home={homeCurrency}
            rateFor={rateFor}
            formMembers={formMembers}
            formDays={formDays}
            homeCurrency={homeCurrency}
          />
        </div>
      )}
    </div>
  );
}

function EmptyMoney({ addForm }: { addForm: React.ReactNode }) {
  return (
    <div className="mt-8 rounded-lg bg-sheet px-6 py-14 text-center">
      <h2 className="text-xl">Nothing logged yet</h2>
      <p className="mx-auto mt-2 max-w-[48ch] text-sm text-ink-soft">
        Add an expense and Floc works out the fewest payments to square
        everyone up.
      </p>
      <div className="mt-5 flex justify-center">
        <Sheet trigger="Add the first expense" title="Expense" keepOpenOnSubmit>
          {addForm}
        </Sheet>
      </div>
    </div>
  );
}

function SettledBanner({ addForm }: { addForm: React.ReactNode }) {
  return (
    <section className="rounded-lg bg-mint px-6 py-9 text-center text-mint-ink">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sheet text-mint-ink">
        <svg
          width={24}
          height={24}
          viewBox="0 0 14 14"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.4}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M3 7.3l2.8 2.7L11 4.2" />
        </svg>
      </span>
      <h2 className="mt-3 text-2xl">Trip settled up</h2>
      <p className="mt-1 text-sm opacity-80">Everyone&rsquo;s square.</p>
      <div className="mt-5 flex justify-center">
        <Sheet
          trigger="Add expense"
          title="Expense"
          triggerVariant="secondary"
          keepOpenOnSubmit
        >
          {addForm}
        </Sheet>
      </div>
    </section>
  );
}

/**
 * The simplified transfers that square everyone up, per currency, netted
 * across the group. The viewer's own are blue with a "Settle up" that records
 * the payment; everyone else's are quiet.
 */
function SettleUpCard({
  tripId,
  transfers,
  viewerId,
  label,
  tone,
  home,
  rateFor,
}: {
  tripId: number;
  transfers: { from: string; to: string; amountMinor: number; currency: Currency }[];
  viewerId: string;
  label: (userId: string) => string;
  tone: (userId: string) => string | undefined;
  home: Currency;
  rateFor: (currency: Currency) => number | null;
}) {
  if (transfers.length === 0) return null;
  return (
    <section className="rounded-lg bg-sheet p-6">
      <h2 className="border-b border-rule pb-3 text-xl">Settle up</h2>
      <ul className="mt-2 flex flex-col">
        {transfers.map((t, i) => {
          const mine = t.from === viewerId;
          return (
            <li
              key={i}
              className="flex flex-wrap items-center justify-between gap-3 border-b border-rule py-3 last:border-b-0"
            >
              <span className="flex items-center gap-2.5">
                <Avatar name={label(t.from)} tone={tone(t.from)} size={28} />
                <span className="text-sm">
                  <span className={cx(t.from === viewerId && "font-semibold text-pen-deep")}>
                    {label(t.from)}
                  </span>
                  <span className="mx-1.5 text-ink-faint">→</span>
                  <span className={cx(t.to === viewerId && "font-semibold text-pen-deep")}>
                    {label(t.to)}
                  </span>
                </span>
              </span>
              <span className="flex items-center gap-3">
                <ConvertAmount
                  amountMinor={t.amountMinor}
                  currency={t.currency}
                  home={home}
                  rate={rateFor(t.currency)}
                  className="nums text-sm font-medium"
                />
                <Sheet
                  trigger={mine ? "Settle up" : "Mark paid"}
                  title="Settle up"
                  triggerVariant={mine ? "primary" : "secondary"}
                  keepOpenOnSubmit
                >
                  <SettleUpForm
                    tripId={tripId}
                    fromUserId={t.from}
                    toUserId={t.to}
                    fromName={label(t.from)}
                    toName={label(t.to)}
                    currency={t.currency}
                    amountMinor={t.amountMinor}
                    action={recordSettlement}
                  />
                </Sheet>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

type FeedItem =
  | { kind: "expense"; at: Date; expense: Expense }
  | { kind: "settlement"; at: Date; settlement: Settlement };

function ActivityFeed(props: {
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
          Cash · {formatDate(toIsoDate(s.createdAt))}
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
