/**
 * Money tab (ticket 16). Never gated (ticket 04) — no locked state here.
 *
 * Renders: the expense list (newest first, tabular figures), per-currency
 * balances + settle-up suggestions derived at read time from `expense_split`
 * (ticket 04), and "mark as paid" as a ledger line only — v1 moves no money.
 */
import { and, desc, eq, inArray, isNull } from "drizzle-orm";

import { db } from "@/db";
import { day, expense, expenseSplit, user, userProfile } from "@/db/schema";
import type { Currency, Expense, ExpenseSplit } from "@/db/schema";
import { requireTripAccess } from "@/lib/access";
import { formatDate } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import type { LedgerLine } from "@/lib/money";
import { getProfile } from "@/lib/profile";
import {
  Avatar,
  Badge,
  Card,
  CardHeader,
  EmptyState,
  Page,
  PageHeader,
  Stack,
} from "@/components/ui";
import { Sheet, ConfirmSubmit } from "@/components/client-ui";
import { ExpenseForm } from "@/components/expense-form";
import type { FormDay, FormMember } from "@/components/expense-form";
import { BalanceSummary } from "@/components/balance-summary";
import { addExpense, deleteExpense, toggleSettled, updateExpense } from "./actions";

/**
 * How a stored `split_type` reads back. The form no longer offers these as
 * modes (ticket 85) — it writes `shares` when nobody was pinned and `exact`
 * when somebody was — but every one of them exists on rows already written, so
 * the list stays and the wording just stops promising a picker.
 */
const SPLIT_LABELS: Record<Expense["splitType"], string> = {
  even: "Split evenly",
  exact: "Set amounts",
  percentage: "By percentage",
  shares: "By shares",
};

/**
 * Reading the split back is now a question about the *numbers*, not the stored
 * type: an even split is written as one share each, so "By shares" would be a
 * needlessly technical way to say "everyone paid the same". Within a penny,
 * because that's how the remainder is handed out.
 */
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

  /*
   * The splits are scoped by joining back to `expense` on `trip_id` rather
   * than by an `inArray` over ids the expense read returns, so they no longer
   * cost a second serial round trip — the whole page is one trip behind the
   * access check.
   *
   * The join also restores the soft-delete filter (CLAUDE.md rule 8): the old
   * `inArray` read had no `isNull(deletedAt)` on `expense_split`, so a split
   * belonging to a deleted expense could still be counted into the balances.
   */
  const [expenses, days, viewerProfile, splits] = await Promise.all([
    db
      .select()
      .from(expense)
      .where(and(eq(expense.tripId, tripId), isNull(expense.deletedAt)))
      .orderBy(desc(expense.createdAt))
      .all(),
    db
      .select({ id: day.id, date: day.date })
      .from(day)
      .where(and(eq(day.tripId, tripId), isNull(day.deletedAt)))
      .orderBy(day.date)
      .all(),
    getProfile(access.viewer.id),
    db
      .select()
      .from(expenseSplit)
      .innerJoin(expense, eq(expense.id, expenseSplit.expenseId))
      .where(
        and(
          eq(expense.tripId, tripId),
          isNull(expense.deletedAt),
          isNull(expenseSplit.deletedAt),
        ),
      )
      .all()
      // A join returns `{ expense_split, expense }` per row; the page only
      // ever wanted the split.
      .then((rows) => rows.map((r) => r.expense_split)),
  ]);

  // Participants may include someone who has since left the trip, so names
  // come from a direct user lookup, not the current member list (ticket 04).
  const knownIds = new Set(access.members.map((m) => m.userId));
  const extraIds = new Set<string>();
  for (const s of splits) if (!knownIds.has(s.userId)) extraIds.add(s.userId);
  for (const e of expenses) if (!knownIds.has(e.paidBy)) extraIds.add(e.paidBy);

  const extraUsers = extraIds.size
    ? await db
        .select({
          id: user.id,
          name: user.name,
          displayName: userProfile.displayName,
        })
        .from(user)
        .leftJoin(userProfile, eq(userProfile.userId, user.id))
        .where(inArray(user.id, [...extraIds]))
        .all()
    : [];

  const userNames: Record<string, string> = {};
  for (const m of access.members) userNames[m.userId] = m.name;
  for (const u of extraUsers) userNames[u.id] = u.displayName ?? u.name;
  const name = (userId: string) => userNames[userId] ?? "Former member";

  // Current members keep their roster colour; a former member falls through to
  // the name hash, which is the honest signal that they're no longer seated.
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

  // Plain element, not a render prop: a function child cannot cross the
  // server/client boundary. The sheets around it are `keepOpenOnSubmit` — a
  // split the server refuses has to stay on screen with its reason — and
  // `ExpenseForm` closes them itself once the save comes back clean.
  const addForm = (
    <ExpenseForm
      tripId={tripId}
      members={formMembers}
      days={formDays}
      homeCurrency={homeCurrency}
      viewerId={access.viewer.id}
      action={addExpense}
    />
  );

  return (
    <Page wide flush>
      <PageHeader
        title="Money"
        subtitle="A shared ledger, not a payment rail — nothing here moves real money."
        actions={
          <Sheet trigger="Add a cost" title="Add a cost" keepOpenOnSubmit>
            {addForm}
          </Sheet>
        }
      />

      {expenses.length === 0 ? (
        <EmptyState
          title="No costs logged yet"
          action={
            <Sheet trigger="Add the first cost" title="Add a cost" keepOpenOnSubmit>
              {addForm}
            </Sheet>
          }
        >
          Once someone logs a cost, it&rsquo;ll show up here — with who paid,
          how it&rsquo;s split, and what everyone owes.
        </EmptyState>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <Card>
            <CardHeader
              title="Costs"
              hint={`${expenses.length} logged, newest first`}
            />
            <div className="divide-y divide-rule">
              {expenses.map((e) => {
                const rowSplits = splitsByExpense.get(e.id) ?? [];
                const viewerSplit = rowSplits.find((s) => s.userId === access.viewer.id);
                const d = e.dayId ? dayById.get(e.dayId) : null;

                return (
                  <div key={e.id} className="px-4 py-3">
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
                      <div className="text-right">
                        <p className="nums font-semibold">
                          {formatMoney(e.amountMinor, e.currency)}
                        </p>
                        {viewerSplit ? (
                          <p className="nums mt-0.5 text-xs text-ink-soft">
                            Your share: {formatMoney(viewerSplit.owedAmountMinor, e.currency)}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {rowSplits.map((s) => {
                        // A member may settle their own split; the payer may
                        // also settle a split against them, since they're
                        // the one who'd know the money actually moved
                        // off-app (ticket 16).
                        const canToggle =
                          s.userId === access.viewer.id || e.paidBy === access.viewer.id;
                        const settled = !!s.settledAt;
                        return (
                          <form key={s.id} action={toggleSettled}>
                            <input type="hidden" name="tripId" value={tripId} />
                            <input type="hidden" name="splitId" value={s.id} />
                            <button
                              type="submit"
                              disabled={!canToggle}
                              className="disabled:cursor-default"
                              title={
                                canToggle
                                  ? settled
                                    ? "Mark unpaid"
                                    : "Mark paid"
                                  : undefined
                              }
                            >
                              <Badge tone={settled ? "agreed" : "open"}>
                                {name(s.userId)}: {formatMoney(s.owedAmountMinor, e.currency)}
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

                    <div className="mt-3 flex gap-2">
                      <Sheet trigger="Edit" title="Edit cost" triggerVariant="ghost" keepOpenOnSubmit>
                        <ExpenseForm
                            tripId={tripId}
                            members={formMembers}
                            days={formDays}
                            homeCurrency={homeCurrency}
                            viewerId={access.viewer.id}
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
                        <ConfirmSubmit message={`Delete "${e.description}"?`}>
                          Delete
                        </ConfirmSubmit>
                      </form>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Stack gap={4}>
            <BalanceSummary lines={ledgerLines} userNames={userNames} />
          </Stack>
        </div>
      )}
    </Page>
  );
}
