/**
 * Money tab (ticket 16; re-modelled by the money overhaul). Splitwise-shaped:
 * balances are derived at read time from expenses − settlements (rule 04,
 * `ledgerBalances`), the page shows only the *simplified* transfers that
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
import { ledgerBalances } from "@floc/core/money/ledger";
import { suggestSettlements } from "@floc/core/money/money";
import { yourSettleUp, type CurrencyTransfer } from "@floc/core/money/settle-up";
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
import { ConvertAmount } from "@/components/money/money-client";
import { pairSettleUpFrom, type PairSettleUp } from "@/server/money/pair-settle-up";
import type { PairRow } from "@floc/core/money/pair-settle";
import { formatMoney } from "@floc/core/money/money";
import { PairSettleForm, SettleUpForm } from "@/components/money/settlement-form";
import { ActivityFeed } from "@/components/money/money-activity";
import { ExpenseForm } from "@/components/money/expense-form";
import type { FormDay, FormMember } from "@/components/money/expense-form";
import { addExpense, recordSettlement, settlePair } from "./actions";

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

  const balances = ledgerBalances({ expenses, splits, settlements });
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
  const pairs = await pairSettleUpFrom({ ledger: { expenses, splits, settlements }, viewerId, base: homeCurrency, rates });

  return (
    <div className="mx-auto w-full max-w-[64rem] px-4 pb-20 pt-6 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <PageTitle>Money</PageTitle>
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
              viewerId={viewerId}
              pairs={pairs}
              label={label}
              tone={tone}
              home={homeCurrency}
              rateFor={rateFor}
            />
          )}

          <ActivityFeed
            collapsed={mine.settled}
            action={
              <Sheet trigger="Add expense" title="Expense" keepOpenOnSubmit>
                {addForm}
              </Sheet>
            }
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
    <section className="rounded-lg bg-pastel-green px-6 py-9 text-center text-pastel-green-ink">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sheet text-pastel-green-ink">
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
  viewerId,
  pairs,
  label,
  tone,
  home,
  rateFor,
}: {
  tripId: number;
  viewerId: string;
  pairs: PairSettleUp;
  label: (userId: string) => string;
  tone: (userId: string) => string | undefined;
  home: Currency;
  rateFor: (currency: Currency) => number | null;
}) {
  const row = (pair: PairRow) => {
    const paying = pair.payer === viewerId;
    const other = pair.other;
    const t = { from: pair.payer, to: pair.payee, currency: pair.currency, amountMinor: pair.amountMinor };
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
          {pair.netted ? (
            <span className="nums text-sm font-medium">{formatMoney(pair.amountMinor, pair.currency)}</span>
          ) : (
            <ConvertAmount
              amountMinor={t.amountMinor}
              currency={t.currency}
              home={home}
              rate={rateFor(t.currency)}
              className="nums text-sm font-medium"
            />
          )}
          <Sheet trigger="Settle up" title="Settle up" triggerVariant={paying ? "primary" : "secondary"} keepOpenOnSubmit>
            {pair.netted ? (
              <PairSettleForm
                tripId={tripId}
                otherUserId={other}
                summary={<PairSummary pair={pair} viewerId={viewerId} rateDate={pairs.rateDate} label={label} />}
                action={settlePair}
              />
            ) : (
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
            )}
          </Sheet>
        </span>
      </li>
    );
  };

  const column = (
    title: string,
    empty: string,
    rows: PairRow[],
    paying: boolean,
  ) => {
    return (
      <section className="rounded-lg bg-sheet p-6">
        <SectionHeading className="border-b border-rule pb-3">{title}</SectionHeading>
        {rows.length === 0 ? (
          <p className="flex min-h-[8rem] flex-col items-center justify-center gap-1 text-center">
            <span className="font-display text-xl text-pastel-green-ink">{empty}</span>
            <span className="text-sm text-ink-soft">
              {paying
                ? "You have paid your share."
                : "Everyone has paid you back."}
            </span>
          </p>
        ) : (
          <>
            <ul className="mt-2 flex flex-col">
              {rows.map(row)}
            </ul>
          </>
        )}
      </section>
    );
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {column("You owe", "All square", pairs.rows.filter((p) => p.payer === viewerId), true)}
      {column("You are owed", "Nothing to chase", pairs.rows.filter((p) => p.payee === viewerId), false)}
    </div>
  );
}

/** One netted payment as a receipt (#461): the figure and who it goes to, each debt it clears, then the rate (#253 keeps it beside the number). */
function PairSummary({ pair, viewerId, rateDate, label }: { pair: PairRow; viewerId: string; rateDate: string | null; label: (userId: string) => string }) {
  const youPay = pair.payer === viewerId;
  const other = label(pair.other);
  const lines = [...pair.parts]
    .sort((a, b) => Number(b.fromUserId === pair.payer) - Number(a.fromUserId === pair.payer))
    .map((p) => {
      const owedBy = p.fromUserId === viewerId ? `You owe ${other}` : `${other} owes you`;
      const sign = p.fromUserId === pair.payer ? "" : "−";
      const cleared = formatMoney(p.clearsAmountMinor ?? p.amountMinor, p.clearsCurrency ?? p.currency);
      const inPay = p.clearsCurrency ? formatMoney(p.amountMinor, p.currency) : null;
      return { key: `${p.fromUserId}-${p.clearsCurrency ?? p.currency}`, owedBy, figure: `${sign}${cleared}`, inPay: inPay && `${sign}${inPay}` };
    });
  const rated = pair.parts.find((p) => p.fxRate && p.clearsCurrency);
  return (
    <div className="flex flex-col gap-5">
      <div className="text-center">
        <p className="nums font-display text-4xl tracking-tight">{formatMoney(pair.amountMinor, pair.currency)}</p>
        <p className="mt-1 text-sm text-ink-soft">{youPay ? `from you to ${other}` : `from ${other} to you`}</p>
      </div>
      <dl className="rounded-lg bg-sheet-2 px-4 py-1 text-sm">
        {lines.map((l) => (
          <div key={l.key} className="flex items-baseline justify-between gap-4 border-b border-rule py-2.5">
            <dt className="text-ink-soft">{l.owedBy}</dt>
            <dd className="nums text-right">
              {l.figure}
              {l.inPay ? <span className="block text-xs text-ink-faint">{l.inPay}</span> : null}
            </dd>
          </div>
        ))}
        <div className="flex items-baseline justify-between gap-4 py-2.5 font-medium">
          <dt>{youPay ? "You pay" : `${other} pays`}</dt>
          <dd className="nums">{formatMoney(pair.amountMinor, pair.currency)}</dd>
        </div>
      </dl>
      {rated ? (
        <p className="text-center text-xs text-ink-faint">
          {rateDate ? `Rate on ${formatDate(rateDate, { weekday: false })}: ` : "Rate: "}1 {pair.currency} = {rated.fxRate!.toFixed(4)} {rated.clearsCurrency}
        </p>
      ) : null}
    </div>
  );
}
