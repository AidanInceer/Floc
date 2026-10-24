/**
 * Money tab (ticket 16; re-modelled by the money overhaul). Splitwise-shaped:
 * balances are derived at read time from expenses − settlements (rule 04,
 * `ledgerBalances`), the page shows only the *simplified* transfers that
 * square everyone up, and a merged activity feed of expenses and settlements
 * that any member can delete to revert. The top of the page is the group's
 * fewest payments across currencies, in the viewer's home currency (#463): the
 * viewer's own first and large, everyone else's small under them.
 */
import type { Currency, ExpenseSplit } from "@/db/schema";
import { requireTripAccess } from "@/server/access";
import { formatDate } from "@floc/core/dates/dates";
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
import { settleUpFrom, type SettleUp } from "@/server/money/settle-up";
import { paidIn, type SettleRow } from "@floc/core/money/group-settle";
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

  const settle = await settleUpFrom({ ledger: { expenses, splits, settlements }, viewerId });
  const settled = settle.rows.length === 0;

  return (
    <div className="mx-auto w-full max-w-[64rem] px-4 pb-20 pt-6 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <PageTitle>Money</PageTitle>
      </header>

      {!hasActivity ? (
        <EmptyMoney addForm={addForm} />
      ) : (
        <div className="mt-8 flex flex-col gap-4">
          {settled ? (
            <SettledBanner addForm={addForm} />
          ) : (
            <SettleUpPanel tripId={tripId} viewerId={viewerId} settle={settle} label={label} tone={tone} />
          )}

          <ActivityFeed
            collapsed={settled}
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
 * The group's payments (#463): yours first and large, money out on the left and in on the right; then, small, the
 * payments between other people. Only the two people in a payment can mark it paid, so theirs have no button.
 */
function SettleUpPanel({
  tripId,
  viewerId,
  settle,
  label,
  tone,
}: {
  tripId: number;
  viewerId: string;
  settle: SettleUp;
  label: (userId: string) => string;
  tone: (userId: string) => string | undefined;
}) {
  const row = (r: SettleRow) => {
    const paying = r.payer === viewerId;
    const other = paying ? r.payee : r.payer;
    return (
      <li key={`${r.payer}-${r.payee}`} className="flex flex-wrap items-center justify-between gap-3 border-b border-rule py-3 last:border-b-0">
        <span className="flex items-center gap-2.5">
          <Avatar name={label(other)} tone={tone(other)} size={32} />
          <span className="text-[15px]">{label(other)}</span>
        </span>
        <span className="flex items-center gap-3">
          <span className="nums font-display text-xl tracking-tight">{formatMoney(r.amountMinor, r.currency)}</span>
          <Sheet trigger="Settle up" title="Settle up" triggerVariant={paying ? "primary" : "secondary"} keepOpenOnSubmit>
            {r.netted ? (
              <PairSettleForm
                tripId={tripId}
                otherUserId={other}
                summary={<PairSummary row={r} viewerId={viewerId} rateDate={settle.rateDate} label={label} />}
                action={settlePair}
              />
            ) : (
              <SettleUpForm
                tripId={tripId}
                fromUserId={r.payer}
                toUserId={r.payee}
                fromName={label(r.payer)}
                toName={label(r.payee)}
                currency={r.currency}
                amountMinor={r.amountMinor}
                action={recordSettlement}
              />
            )}
          </Sheet>
        </span>
      </li>
    );
  };

  const column = (title: string, empty: string, note: string, rows: SettleRow[]) => (
    <section className="rounded-lg bg-sheet p-6">
      <SectionHeading className="border-b border-rule pb-3">{title}</SectionHeading>
      {rows.length === 0 ? (
        <p className="flex min-h-[8rem] flex-col items-center justify-center gap-1 text-center">
          <span className="font-display text-xl text-pastel-green-ink">{empty}</span>
          <span className="text-sm text-ink-soft">{note}</span>
        </p>
      ) : (
        <ul className="mt-2 flex flex-col">{rows.map(row)}</ul>
      )}
    </section>
  );

  const others = settle.rows.filter((r) => r.payer !== viewerId && r.payee !== viewerId);
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        {column("You owe", "All square", "You have paid your share.", settle.rows.filter((r) => r.payer === viewerId))}
        {column("You are owed", "Nothing to chase", "Everyone has paid you back.", settle.rows.filter((r) => r.payee === viewerId))}
      </div>
      {others.length > 0 ? (
        <section className="rounded-lg bg-sheet px-6 py-4">
          <h3 className="text-xs font-medium text-ink-soft">Between the others</h3>
          <ul className="mt-1 flex flex-col">
            {others.map((r) => (
              <li key={`${r.payer}-${r.payee}`} className="flex items-baseline justify-between gap-3 py-1.5 text-sm text-ink-soft">
                <span>
                  {label(r.payer)} owes {label(r.payee)}
                </span>
                <span className="nums">{formatMoney(r.amountMinor, r.currency)}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

/**
 * One payment as a receipt (#461): the figure in your currency, each debt it clears, what the payer hands over in
 * theirs, then the rate (#253 keeps it beside the number).
 */
function PairSummary({ row, viewerId, rateDate, label }: { row: SettleRow; viewerId: string; rateDate: string | null; label: (userId: string) => string }) {
  const youPay = row.payer === viewerId;
  const other = label(youPay ? row.payee : row.payer);
  const paid = paidIn(row);
  const lines = row.parts.map((p) => {
    const owedBy = p.fromUserId === viewerId ? `You owe ${other}` : `${other} owes you`;
    const sign = p.fromUserId === row.payer ? "" : "−";
    const cleared = formatMoney(p.clearsAmountMinor ?? p.amountMinor, p.clearsCurrency ?? p.currency);
    const inPay = p.clearsCurrency ? formatMoney(p.amountMinor, p.currency) : null;
    return { key: `${p.fromUserId}-${p.clearsCurrency ?? p.currency}`, owedBy, figure: `${sign}${cleared}`, inPay: inPay && `${sign}${inPay}` };
  });
  const rated = row.parts.find((p) => p.fxRate && p.clearsCurrency);
  return (
    <div className="flex flex-col gap-5">
      <div className="text-center">
        <p className="nums font-display text-4xl tracking-tight">{formatMoney(row.amountMinor, row.currency)}</p>
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
          <dd className="nums">{formatMoney(paid.amountMinor, paid.currency)}</dd>
        </div>
      </dl>
      {rated?.fxRate ? (
        <p className="text-center text-xs text-ink-faint">
          {rateDate ? `Rate on ${formatDate(rateDate, { weekday: false })}: ` : "Rate: "}1 {paid.currency} = {rated.fxRate.toFixed(4)} {rated.clearsCurrency}
        </p>
      ) : null}
    </div>
  );
}
