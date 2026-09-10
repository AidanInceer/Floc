/**
 * Money tab (ticket 16; re-modelled by the money overhaul). Splitwise-shaped:
 * balances are derived at read time from expenses − settlements (rule 04,
 * `computeBalances`), the page shows only the *simplified* transfers that
 * square everyone up, and a merged activity feed of expenses and settlements
 * that any member can delete to revert. When every book nets to zero the whole
 * tab collapses behind a "settled up" banner.
 */
import type { Currency, ExpenseSplit } from "@/db/schema";
import { CURRENCIES } from "@/db/schema";
import { requireTripAccess } from "@/server/access";
import { formatDate } from "@floc/core/dates";
import {
  computeBalances,
  convertTotal,
  formatMoney,
  isAllSettled,
  suggestSettlements,
} from "@floc/core/money";
import type { LedgerLine, LedgerSettlement } from "@floc/core/money";
import { listDays } from "@/server/itinerary/itinerary";
import {
  listExpenses,
  listSettlements,
  listSplits,
  namesForUsers,
} from "@/server/money/money";
import { getProfile } from "@/server/auth/profile";
import { getHomeRates } from "@/server/money/fx";
import { Avatar, cx } from "@/components/ui";
import { Sheet } from "@/components/client-ui";
import { CombinedTotal, ConvertAmount, SettleUpForm } from "@/components/money-client";
import { ActivityFeed } from "@/components/money-activity";
import { ExpenseForm } from "@/components/expense-form";
import type { FormDay, FormMember } from "@/components/expense-form";
import { addExpense, recordSettlement } from "./actions";

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

  // The viewer's own position, one row per currency — the truth the combined
  // total only previews (ticket 253). Negative reads as owing, or as having
  // overpaid once the expense behind a settlement is deleted.
  // Bills alone, no settlements — the yardstick for "overpaid": settle-up has
  // pushed the viewer above where the expenses put them, which is what an
  // expense deleted after a settlement looks like (ticket 253).
  const expenseOnly = computeBalances(ledgerLines);
  const myPosition = active
    .map((currency) => ({
      currency,
      amountMinor: balances[currency][viewerId] ?? 0,
      overpaid:
        (balances[currency][viewerId] ?? 0) >
        Math.max(expenseOnly[currency][viewerId] ?? 0, 0),
    }))
    .filter((row) => row.amountMinor !== 0);
  const myTotalInHome = convertTotal(myPosition, homeCurrency, rateFor);

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
            <>
              <YourPosition
                rows={myPosition}
                active={active}
                home={homeCurrency}
                totalInHome={myTotalInHome}
                rateDate={rates?.date ?? null}
                rateStale={rates?.stale ?? false}
              />
              <SettleUpCard
                tripId={tripId}
                transfers={transfers}
                viewerId={viewerId}
                label={label}
                tone={tone}
                home={homeCurrency}
                rateFor={rateFor}
              />
            </>
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
 * Where the viewer stands, one honest row per currency (ticket 253). A trip
 * with GBP flights and EUR meals is the normal trip, so this never collapses
 * the two — the combined figure underneath is a preview, marked `≈`, and only
 * appears when a rate exists.
 */
function YourPosition({
  rows,
  active,
  home,
  totalInHome,
  rateDate,
  rateStale,
}: {
  rows: { currency: Currency; amountMinor: number; overpaid: boolean }[];
  active: Currency[];
  home: Currency;
  totalInHome: number | null;
  rateDate: string | null;
  rateStale: boolean;
}) {
  if (rows.length === 0) return null;
  return (
    <section className="rounded-lg bg-sheet p-6">
      <h2 className="border-b border-rule pb-3 text-xl">Where you stand</h2>
      {active.length > 1 ? (
        <p className="mt-3 text-sm text-ink-soft">
          This trip has balances in {active.join(" and ")}.
        </p>
      ) : null}
      <ul className="mt-2 flex flex-col">
        {rows.map((row) => (
          <li
            key={row.currency}
            className="flex items-center justify-between gap-3 border-b border-rule py-3 last:border-b-0"
          >
            <span className="text-sm text-ink-soft">
              {row.overpaid
                ? "Owed back to you — you overpaid"
                : row.amountMinor > 0
                  ? "You are owed"
                  : "You owe"}
            </span>
            <span className="nums text-sm font-medium">
              {formatMoney(Math.abs(row.amountMinor), row.currency)}
            </span>
          </li>
        ))}
      </ul>
      {rateDate && active.length > 1 ? (
        <CombinedTotal
          totalMinor={totalInHome}
          home={home}
          rateDate={rateDate}
          stale={rateStale}
        />
      ) : null}
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
