/**
 * Money tab (ticket 16; re-modelled by the money overhaul). Splitwise-shaped:
 * balances are derived at read time from expenses − settlements (rule 04,
 * `computeBalances`), the page shows only the *simplified* transfers that
 * square everyone up, and a merged activity feed of expenses and settlements
 * that any member can delete to revert. The top of the page is the viewer's
 * own two sides only — what they owe, what they are owed (#317) — and collapses
 * behind a "settled up" banner as soon as *they* are square, whether or not two
 * other people still owe each other.
 */
import type { Currency, ExpenseSplit } from "@/db/schema";
import { CURRENCIES } from "@/db/schema";
import { requireTripAccess } from "@/server/access";
import { formatDate } from "@floc/core/dates/dates";
import {
  computeBalances,
  convertTotal,
  formatMoney,
  suggestSettlements,
} from "@floc/core/money/money";
import {
  yourSettleUp,
  type CurrencyTotal,
  type CurrencyTransfer,
  type YourSettleUp,
} from "@floc/core/money/settle-up";
import type { LedgerLine, LedgerSettlement } from "@floc/core/money/money";
import { listDays } from "@/server/itinerary/itinerary";
import {
  listExpenses,
  listSettlements,
  listSplits,
  namesForUsers,
} from "@/server/money/money";
import { getProfile } from "@/server/auth/profile";
import { getHomeRates } from "@/server/money/fx";
import { Avatar, PageTitle, EmptyState, SectionHeading } from "@/components/system/ui";
import { Sheet } from "@/components/system/client-ui";
import { ConvertAmount, SettleUpForm } from "@/components/money/money-client";
import { ActivityFeed } from "@/components/money/money-activity";
import { ExpenseForm } from "@/components/money/expense-form";
import type { FormDay, FormMember } from "@/components/money/expense-form";
import { addExpense, recordSettlement } from "./actions";

export const metadata = { title: "Money" };

export default async function MoneyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const access = await requireTripAccess(id, `/trip/${id}/money`);
  const tripId = access.trip.id;
  const viewerId = access.viewer.id;

  const homeRates = getProfile(viewerId).then(async (profile) => {
    const home: Currency = profile?.homeCurrency ?? "GBP";
    return { home, rates: await getHomeRates(home) };
  });
  const [expenses, days, { home: homeCurrency, rates }, splits, settlements] =
    await Promise.all([
      listExpenses(tripId),
      listDays(tripId),
      homeRates,
      listSplits(tripId),
      listSettlements(tripId),
    ]);

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
  const label = (userId: string) =>
    userId === viewerId ? "You" : name(userId);

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
    clearsCurrency: s.clearsCurrency,
    clearsAmountMinor: s.clearsAmountMinor,
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

  // Every transfer that squares the group up, across currencies — then only the
  // viewer's own, because the rest is other people's business (#317).
  const transfers: CurrencyTransfer[] = active.flatMap((currency) =>
    suggestSettlements(balances[currency]).map((s) => ({ ...s, currency })),
  );
  const mine = yourSettleUp({ transfers, viewerId });

  return (
    <div className="mx-auto w-full max-w-[64rem] px-4 pb-20 pt-6 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <PageTitle>Money</PageTitle>
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
          {mine.settled ? (
            <SettledBanner addForm={addForm} />
          ) : (
            <MySettleUp
              tripId={tripId}
              mine={mine}
              label={label}
              tone={tone}
              home={homeCurrency}
              rateFor={rateFor}
            />
          )}

          <ActivityFeed
            collapsed={mine.settled}
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
    <div className="mt-8">
      <EmptyState
        title="Nothing logged yet"
        action={
          <Sheet trigger="Log the first cost" title="Expense" keepOpenOnSubmit>
            {addForm}
          </Sheet>
        }
      >
        Add an expense and Floc works out the fewest payments to square everyone
        up.
      </EmptyState>
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
          strokeWidth={1.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M3 7.3l2.8 2.7L11 4.2" />
        </svg>
      </span>
      <SectionHeading className="mt-3">Trip settled up</SectionHeading>
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
 * Your own side of settle-up, and only yours (#317): money out on the left,
 * money in on the right, each side holding its own total per currency. A
 * transfer between two other people is real but it is not yours to act on — it
 * shows in the feed when it happens, and a button on somebody else's debt was
 * what made this page read as a wall.
 */
function MySettleUp({
  tripId,
  mine,
  label,
  tone,
  home,
  rateFor,
}: {
  tripId: number;
  mine: YourSettleUp;
  label: (userId: string) => string;
  tone: (userId: string) => string | undefined;
  home: Currency;
  rateFor: (currency: Currency) => number | null;
}) {
  const row = (t: CurrencyTransfer, paying: boolean) => {
    const other = paying ? t.to : t.from;
    return (
      <li
        key={`${t.from}-${t.to}-${t.currency}`}
        className="flex flex-wrap items-center justify-between gap-3 border-b border-rule py-3 last:border-b-0"
      >
        <span className="flex items-center gap-2.5">
          <Avatar name={label(other)} tone={tone(other)} size={28} />
          <span className="text-sm">{label(other)}</span>
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
            trigger={paying ? "Settle up" : "Mark paid"}
            title="Settle up"
            triggerVariant={paying ? "primary" : "secondary"}
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
  };

  const column = (
    title: string,
    empty: string,
    rows: CurrencyTransfer[],
    totals: CurrencyTotal[],
    paying: boolean,
  ) => {
    // Two currencies never add up, so each keeps its own figure and the home
    // total underneath is a preview, marked `≈` (ticket 253).
    const approx =
      totals.length > 1 ? convertTotal(totals, home, rateFor) : null;
    return (
      <section className="rounded-lg bg-sheet p-6">
        <SectionHeading className="border-b border-rule pb-3">{title}</SectionHeading>
        {rows.length === 0 ? (
          <p className="flex min-h-[8rem] flex-col items-center justify-center gap-1 text-center">
            <span className="font-display text-xl text-mint-ink">{empty}</span>
            <span className="text-sm text-ink-soft">
              {paying
                ? "You have paid your share."
                : "Everyone has paid you back."}
            </span>
          </p>
        ) : (
          <>
            <p className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              {totals.map((total) => (
                <span
                  key={total.currency}
                  className="nums font-display text-2xl"
                >
                  {formatMoney(total.amountMinor, total.currency)}
                </span>
              ))}
              {approx !== null ? (
                <span className="nums text-sm text-ink-soft">
                  &asymp; {formatMoney(approx, home)}
                </span>
              ) : null}
            </p>
            <ul className="mt-2 flex flex-col">
              {rows.map((t) => row(t, paying))}
            </ul>
          </>
        )}
      </section>
    );
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {column("You owe", "All square", mine.owe, mine.oweTotals, true)}
      {column(
        "You are owed",
        "Nothing to chase",
        mine.owed,
        mine.owedTotals,
        false,
      )}
    </div>
  );
}
