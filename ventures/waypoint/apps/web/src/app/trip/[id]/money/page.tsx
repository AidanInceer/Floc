/**
 * Money tab (ticket 16; redesigned 198). Balances are derived at read time
 * from `expense_split` (ticket 04) — v1 moves no real money, and the page says
 * so rather than implying otherwise.
 *
 * The order is what it means for the viewer, then what the trip has cost, then
 * the costs themselves beside the net positions: "what happened" and "what
 * that means" have to be readable together.
 */
import type { Currency, Expense, ExpenseSplit } from "@/db/schema";
import { CURRENCIES } from "@/db/schema";
import { requireTripAccess } from "@/server/access";
import { formatDate } from "@/lib/dates";
import { computeBalances, formatMoney, suggestSettlements } from "@/lib/money";
import type { LedgerLine } from "@/lib/money";
import { listDays } from "@/server/itinerary";
import { listExpenses, listSplits, namesForUsers } from "@/server/money";
import { getProfile } from "@/server/profile";
import { Avatar, Badge, cx } from "@/components/ui";
import {
  ConfirmSubmit,
  Menu,
  Sheet,
  menuDangerItemClass,
  menuItemClass,
} from "@/components/client-ui";
import { ExpenseForm } from "@/components/expense-form";
import type { FormDay, FormMember } from "@/components/expense-form";
import { addExpense, deleteExpense, toggleSettled, updateExpense } from "./actions";

// Stored split_type labels. Form no longer offers these as modes (ticket 85),
// but old rows still carry them.
const SPLIT_LABELS: Record<Expense["splitType"], string> = {
  even: "Split evenly",
  exact: "Set amounts",
  percentage: "By percentage",
  shares: "By shares",
};

// Even split is stored as one share each; read back from the numbers (within
// a penny, for remainder handling) rather than trusting splitType.
function splitLabel(
  e: Expense,
  splits: { owedAmountMinor: number }[],
): string {
  if (splits.length === 1) return "All on one person";
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

  // listSplits scopes by trip_id directly, not via listExpenses' ids, so all
  // four reads run independently (server/money.ts).
  const [expenses, days, viewerProfile, splits] = await Promise.all([
    listExpenses(tripId),
    listDays(tripId),
    getProfile(viewerId),
    listSplits(tripId),
  ]);

  // A participant may have since left the trip, so names need a direct
  // lookup, not just the current member list (ticket 04).
  const knownIds = new Set(access.members.map((m) => m.userId));
  const extraIds = new Set<string>();
  for (const s of splits) if (!knownIds.has(s.userId)) extraIds.add(s.userId);
  for (const e of expenses) if (!knownIds.has(e.paidBy)) extraIds.add(e.paidBy);

  const extraUsers = await namesForUsers([...extraIds]);

  const userNames: Record<string, string> = {};
  for (const m of access.members) userNames[m.userId] = m.name;
  for (const u of extraUsers) userNames[u.id] = u.name;
  const name = (userId: string) => userNames[userId] ?? "Former member";

  // Former members fall through to the name hash — the signal they've left.
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
      settled: !!s.settledAt,
    })),
  }));

  const formMembers: FormMember[] = access.members.map((m) => ({
    userId: m.userId,
    name: m.name,
  }));
  const formDays: FormDay[] = days.map((d) => ({
    id: d.id,
    date: d.date,
    label: formatDate(d.date),
  }));
  const homeCurrency: Currency = viewerProfile?.homeCurrency ?? "GBP";

  // Plain element, not a render prop — a function child can't cross the
  // server/client boundary. Sheets are keepOpenOnSubmit so a server-refused
  // split stays visible with its error; ExpenseForm closes them on success.
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

  const balances = computeBalances(ledgerLines);
  // Currencies are never mixed into one total (non-negotiable 1), so every
  // headline is per currency and the tiles list them rather than summing.
  const active = CURRENCIES.filter((c) => Object.keys(balances[c]).length > 0);
  const spentPer = spendPerCurrency(expenses);
  const headCount = Math.max(access.members.length, 1);

  return (
    <div className="mx-auto w-full max-w-[84rem] px-4 pb-20 pt-6 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="text-[clamp(1.9rem,4vw,2.8rem)]">Money</h1>
          <p className="mt-3 max-w-[64ch] text-md text-ink-soft">
            A shared ledger, not a payment rail — nothing here moves real money.
          </p>
        </div>
        <Sheet trigger="Add a cost" title="Add a cost" keepOpenOnSubmit>
          {addForm}
        </Sheet>
      </header>

      {expenses.length === 0 ? (
        <div className="mt-8 rounded-lg bg-sheet px-6 py-14 text-center">
          <h2 className="text-xl">No costs logged yet</h2>
          <p className="mx-auto mt-2 max-w-[48ch] text-sm text-ink-soft">
            Once someone logs a cost, it&rsquo;ll show up here — with who paid,
            how it&rsquo;s split, and what everyone owes.
          </p>
          <div className="mt-5 flex justify-center">
            <Sheet trigger="Add the first cost" title="Add a cost" keepOpenOnSubmit>
              {addForm}
            </Sheet>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* The page's only blue: the viewer's own position is theirs to act on. */}
            <section className="rounded-lg bg-pen-soft p-6 text-pen-deep sm:col-span-2">
              <p className="typed text-current">Where you stand</p>
              <YourPosition
                active={active}
                balances={balances}
                viewerId={viewerId}
                name={name}
              />
            </section>

            <section className="rounded-lg bg-mint p-6 text-mint-ink">
              <p className="typed text-current">Spent so far</p>
              <p className="nums mt-3 text-3xl font-semibold">
                {spentPer.length === 0
                  ? "—"
                  : formatMoney(spentPer[0].total, spentPer[0].currency)}
              </p>
              <p className="mt-1 text-sm opacity-75">
                {expenses.length} {expenses.length === 1 ? "cost" : "costs"} logged
                {spentPer.length > 1
                  ? `, plus ${spentPer.length - 1} other ${
                      spentPer.length === 2 ? "currency" : "currencies"
                    }`
                  : ""}
              </p>
            </section>

            <section className="rounded-lg bg-sheet p-6">
              <p className="typed">Roughly per head</p>
              <p className="nums mt-3 text-3xl font-semibold">
                {spentPer.length === 0
                  ? "—"
                  : formatMoney(
                      Math.round(spentPer[0].total / headCount),
                      spentPer[0].currency,
                    )}
              </p>
              <p className="mt-1 text-sm text-ink-soft">
                Across {headCount} {headCount === 1 ? "person" : "people"}. A rough
                average, not what anyone actually owes.
              </p>
            </section>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,58fr)_minmax(0,42fr)] lg:items-start">
            <section className="rounded-lg bg-sheet p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-rule pb-3">
                <h2 className="text-xl">Costs</h2>
                <span className="typed">{expenses.length} logged, newest first</span>
              </div>

              <ul className="mt-3 flex flex-col gap-3">
                {expenses.map((e) => {
                  const rowSplits = splitsByExpense.get(e.id) ?? [];
                  const viewerSplit = rowSplits.find((s) => s.userId === viewerId);
                  const d = e.dayId ? dayById.get(e.dayId) : null;

                  // Edit/Delete behind the triple-dot (ticket 125) — settle
                  // badges are the control this row is for.
                  const rowMenu = (
                    <Menu label={`Actions for ${e.description}`}>
                      <Sheet
                        trigger="Edit"
                        title="Edit cost"
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
                  );

                  return (
                    <li key={e.id} className="rounded-md bg-sheet-2 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <Avatar name={name(e.paidBy)} tone={tone(e.paidBy)} />
                          <div>
                            <p className="font-medium">{e.description}</p>
                            <p className="mt-0.5 text-xs text-ink-soft">
                              {name(e.paidBy)} paid · {splitLabel(e, rowSplits)}
                              {d ? ` · ${formatDate(d.date)}` : ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-1.5">
                          <div className="text-right">
                            <p className="nums font-semibold">
                              {formatMoney(e.amountMinor, e.currency)}
                            </p>
                            {viewerSplit ? (
                              <p className="nums mt-0.5 text-xs text-ink-soft">
                                Your share:{" "}
                                {formatMoney(viewerSplit.owedAmountMinor, e.currency)}
                              </p>
                            ) : null}
                          </div>
                          {rowMenu}
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {rowSplits.map((s) => {
                          // Payer may also settle a split against them — they'd
                          // know if the money moved off-app (ticket 16).
                          const canToggle =
                            s.userId === viewerId || e.paidBy === viewerId;
                          const settled = !!s.settledAt;
                          return (
                            <form key={s.id} action={toggleSettled}>
                              <input type="hidden" name="tripId" value={tripId} />
                              <input type="hidden" name="splitId" value={s.id} />
                              <button
                                type="submit"
                                disabled={!canToggle}
                                // Badge is the whole control; hover lives on the button (ticket 120).
                                className="rounded-full transition-opacity hover:opacity-70 disabled:cursor-default disabled:hover:opacity-100"
                                title={
                                  canToggle
                                    ? settled
                                      ? "Mark unpaid"
                                      : "Mark paid"
                                    : undefined
                                }
                              >
                                <Badge tone={settled ? "agreed" : "open"}>
                                  {name(s.userId)}:{" "}
                                  {formatMoney(s.owedAmountMinor, e.currency)}
                                  {" · "}
                                  {settled ? "Settled" : "Open"}
                                </Badge>
                              </button>
                            </form>
                          );
                        })}
                      </div>

                      {e.notes ? (
                        <p className="mt-2 text-sm text-ink-soft">{e.notes}</p>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </section>

            <div className="flex flex-col gap-4">
              {active.map((currency) => (
                <BalanceBook
                  key={currency}
                  currency={currency}
                  book={balances[currency]}
                  viewerId={viewerId}
                  name={name}
                  tone={tone}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * The headline the viewer came for. One line per currency, because a net
 * position in euros is not a net position in pounds and adding them would be
 * a lie (non-negotiable 1).
 */
function YourPosition({
  active,
  balances,
  viewerId,
  name,
}: {
  active: Currency[];
  balances: Record<Currency, Record<string, number>>;
  viewerId: string;
  name: (userId: string) => string;
}) {
  const mine = active
    .map((currency) => ({ currency, amount: balances[currency][viewerId] ?? 0 }))
    .filter((r) => r.amount !== 0);

  if (mine.length === 0) {
    return (
      <>
        <p className="mt-3 text-3xl font-semibold">All square</p>
        <p className="mt-1 text-sm opacity-75">
          Nothing outstanding either way on what has been logged so far.
        </p>
      </>
    );
  }

  return (
    <div className="mt-3 flex flex-col gap-3">
      {mine.map(({ currency, amount }) => {
        // Whoever the money actually moves between, so the number has a
        // counterparty rather than being an abstraction.
        const others = suggestSettlements(balances[currency]).filter((s) =>
          amount > 0 ? s.to === viewerId : s.from === viewerId,
        );
        return (
          <div key={currency}>
            <p className="nums text-3xl font-semibold">
              {/* Sign and word both — owed and owing never read on colour alone. */}
              {amount > 0 ? "+" : "−"}
              {formatMoney(Math.abs(amount), currency)}{" "}
              <span className="text-lg font-medium">
                {amount > 0 ? "owed back to you" : "you owe"}
              </span>
            </p>
            {others.length > 0 ? (
              <p className="mt-1 text-sm opacity-75">
                {amount > 0 ? "From " : "To "}
                {others.map((s) => name(amount > 0 ? s.from : s.to)).join(", ")}
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Net positions for one currency, plus the settle-up it implies. A suggestion
 * only — Waypoint moves no money, and the panel says so.
 */
function BalanceBook({
  currency,
  book,
  viewerId,
  name,
  tone,
}: {
  currency: Currency;
  book: Record<string, number>;
  viewerId: string;
  name: (userId: string) => string;
  tone: (userId: string) => string | undefined;
}) {
  const settlements = suggestSettlements(book);
  const sorted = Object.entries(book).sort((a, b) => b[1] - a[1]);

  return (
    <section className="rounded-lg bg-mint p-6 text-mint-ink">
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-ink/10 pb-3">
        <h2 className="text-xl">Where everyone stands</h2>
        <span className="typed text-current">{currency}</span>
      </div>

      <ul className="mt-3 flex flex-col gap-1.5">
        {sorted.map(([userId, amount]) => (
          <li
            key={userId}
            className={cx(
              "flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm",
              userId === viewerId ? "bg-pen-soft text-pen-deep" : "bg-sheet/70",
            )}
          >
            <span className="flex min-w-0 items-center gap-2">
              <Avatar name={name(userId)} tone={tone(userId)} size={22} />
              <span className="truncate">
                {userId === viewerId ? "You" : name(userId)}
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-2">
              <span className="nums font-medium">
                {amount === 0 ? "" : amount > 0 ? "+" : "−"}
                {formatMoney(Math.abs(amount), currency)}
              </span>
              <Badge tone={amount === 0 ? "neutral" : amount > 0 ? "agreed" : "action"}>
                {amount === 0 ? "Square" : amount > 0 ? "Owed back" : "Owes"}
              </Badge>
            </span>
          </li>
        ))}
      </ul>

      {settlements.length > 0 ? (
        <div className="mt-4 border-t border-ink/10 pt-3">
          <p className="typed text-current">Suggested settle-up</p>
          <ul className="mt-2 flex flex-col gap-1.5">
            {settlements.map((s, i) => (
              <li key={i} className="text-sm opacity-90">
                <span className="font-medium">{name(s.from)}</span> pays{" "}
                <span className="font-medium">{name(s.to)}</span>{" "}
                <span className="nums font-medium">
                  {formatMoney(s.amountMinor, currency)}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs opacity-70">
            A suggestion only — Waypoint moves no money. Settle up however your
            group prefers, then mark it paid.
          </p>
        </div>
      ) : null}
    </section>
  );
}

/**
 * What the trip has cost, per currency, biggest first. Never one summed
 * number: two currencies added together is a made-up figure.
 */
function spendPerCurrency(
  expenses: { currency: Currency; amountMinor: number }[],
): { currency: Currency; total: number }[] {
  const totals = new Map<Currency, number>();
  for (const e of expenses) {
    totals.set(e.currency, (totals.get(e.currency) ?? 0) + e.amountMinor);
  }
  return [...totals.entries()]
    .map(([currency, total]) => ({ currency, total }))
    .sort((a, b) => b.total - a.total);
}
