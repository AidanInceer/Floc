"use server";

/**
 * Money mutations (ticket 16, building on the rules in ticket 04/12).
 *
 * - An expense write always rewrites `expense` + the whole `expense_split`
 *   set in one transaction — last-write-wins on the whole expense, never a
 *   partial-row merge (ticket 12).
 * - `computeSplits` is the only place split maths happens; we just catch its
 *   errors and turn them into a form-friendly string.
 * - Any member may add, edit, or delete an expense — money has no
 *   admin/member distinction beyond the invite/kick/delete list (ticket 01).
 */
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { and, eq, inArray, isNull } from "drizzle-orm";

import { db } from "@/db";
import { expense, expenseSplit, user } from "@/db/schema";
import type { Currency, SplitType } from "@/db/schema";
import { requireTripAccess } from "@/server/access";
import { touch } from "@/server/unlocks";
import {
  computeSplits,
  formatMoney,
  parseMoney,
  resolveWeightedSplit,
} from "@/lib/money";
import type { SplitInput, WeightedInput } from "@/lib/money";
import { emails, sendEmails } from "@/server/email";

export type ActionState = { error?: string };

/**
 * The form posts one model now (ticket 85): who's in, how many shares each,
 * and a pinned amount for anyone whose number is fixed. `resolveWeightedSplit`
 * turns that back into the stored `split_type` vocabulary, and `computeSplits`
 * still does the arithmetic — so the split maths lives in one place, as before.
 *
 * Somebody excluded from the cost simply isn't in `participant`, which is what
 * "tap them out" means on the wire: no row, not a zero row.
 */
function parseSplit(
  formData: FormData,
  amountMinor: number,
): { splitType: SplitType; participants: SplitInput[] } {
  // (Return type spelled out so `SplitInput` is a used import, not just inferred.)
  const ids = formData.getAll("participant").map(String).filter(Boolean);
  const rows: WeightedInput[] = ids.map((userId) => {
    const rawPin = String(formData.get(`pin_${userId}`) ?? "").trim();
    const rawShares = String(formData.get(`shares_${userId}`) ?? "1").trim();
    return {
      userId,
      shares: rawShares === "" ? 0 : Number(rawShares),
      // An empty box is "not pinned" — 0.00 typed on purpose is a real pin of
      // nothing, and the two have to stay tellable apart.
      pinnedMinor: rawPin === "" ? null : parseMoney(rawPin),
    };
  });
  return resolveWeightedSplit(amountMinor, rows);
}

function readExpenseFields(formData: FormData) {
  const description = String(formData.get("description") ?? "").trim();
  const currency = String(formData.get("currency") ?? "") as Currency;
  const paidBy = String(formData.get("paidBy") ?? "");
  const dayIdRaw = formData.get("dayId");
  const dayId = dayIdRaw ? Number(dayIdRaw) : null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  return { description, currency, paidBy, dayId, notes };
}

/**
 * Emails everyone in the split except whoever is at the keyboard right now.
 *
 * Addresses come from the roster `requireTripAccess` already loaded — the
 * `user` table is only consulted for a participant who isn't on it (someone
 * kicked since the expense was written, whose split rows survive by design).
 * The sends go out through `sendEmails` so the whole batch shares one
 * preference lookup.
 */
async function notifyParticipants(args: {
  tripId: number;
  tripName: string;
  fromName: string;
  fromUserId: string;
  description: string;
  currency: Currency;
  splits: { userId: string; owedAmountMinor: number }[];
  members: { userId: string; email: string }[];
}) {
  const others = args.splits.filter((s) => s.userId !== args.fromUserId);
  if (others.length === 0) return;

  const emailById = new Map(args.members.map((m) => [m.userId, m.email]));
  const unknown = others.filter((s) => !emailById.has(s.userId));
  if (unknown.length) {
    const rows = await db
      .select({ id: user.id, email: user.email })
      .from(user)
      .where(inArray(user.id, unknown.map((s) => s.userId)))
      .all();
    for (const r of rows) emailById.set(r.id, r.email);
  }

  await sendEmails(
    others.flatMap((s) => {
      const to = emailById.get(s.userId);
      if (!to) return [];
      return [
        emails.expenseAdded({
          to,
          toUserId: s.userId,
          tripId: args.tripId,
          tripName: args.tripName,
          fromName: args.fromName,
          description: args.description,
          share: formatMoney(s.owedAmountMinor, args.currency),
        }),
      ];
    }),
  );
}

export async function addExpense(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const tripId = Number(formData.get("tripId"));
  const access = await requireTripAccess(tripId);
  const { description, currency, paidBy, dayId, notes } =
    readExpenseFields(formData);

  if (!description) return { error: "Give the cost a description." };
  if (!paidBy) return { error: "Say who paid." };

  let amountMinor: number;
  try {
    amountMinor = parseMoney(String(formData.get("amount") ?? ""));
  } catch (err) {
    return { error: (err as Error).message };
  }

  let splits;
  let splitType: SplitType;
  try {
    const resolved = parseSplit(formData, amountMinor);
    splitType = resolved.splitType;
    splits = computeSplits(amountMinor, splitType, resolved.participants);
  } catch (err) {
    return { error: (err as Error).message };
  }

  await db.transaction(async (tx) => {
    const [row] = await tx
      .insert(expense)
      .values({
        tripId,
        dayId,
        createdBy: access.viewer.id,
        paidBy,
        description,
        amountMinor,
        currency,
        splitType,
        notes,
      })
      .returning({ id: expense.id });

    await tx.insert(expenseSplit).values(
      splits.map((s) => ({
        expenseId: row.id,
        userId: s.userId,
        owedAmountMinor: s.owedAmountMinor,
      })),
    );
  });

  // Mail is a side effect of the write, not part of it: `after()` lets the
  // form come back as soon as the ledger is correct and runs the sends once
  // the response has flushed.
  after(() =>
    notifyParticipants({
      tripId,
      tripName: access.trip.name,
      fromName: access.viewer.name,
      fromUserId: access.viewer.id,
      description,
      currency,
      splits,
      members: access.members,
    }),
  );

  revalidatePath(`/trip/${tripId}/money`);
  return {};
}

export async function updateExpense(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const tripId = Number(formData.get("tripId"));
  const expenseId = Number(formData.get("expenseId"));
  const access = await requireTripAccess(tripId);
  const { description, currency, paidBy, dayId, notes } =
    readExpenseFields(formData);

  if (!description) return { error: "Give the cost a description." };
  if (!paidBy) return { error: "Say who paid." };

  const existing = await db
    .select({ id: expense.id })
    .from(expense)
    .where(
      and(eq(expense.id, expenseId), eq(expense.tripId, tripId), isNull(expense.deletedAt)),
    )
    .get();
  if (!existing) return { error: "That cost no longer exists." };

  let amountMinor: number;
  try {
    amountMinor = parseMoney(String(formData.get("amount") ?? ""));
  } catch (err) {
    return { error: (err as Error).message };
  }

  let splits;
  let splitType: SplitType;
  try {
    const resolved = parseSplit(formData, amountMinor);
    splitType = resolved.splitType;
    splits = computeSplits(amountMinor, splitType, resolved.participants);
  } catch (err) {
    return { error: (err as Error).message };
  }

  // Whole-expense last-write-wins: delete and reinsert the entire split set
  // inside the same transaction as the expense update — never a partial-row
  // merge (ticket 12).
  await db.transaction(async (tx) => {
    await tx
      .update(expense)
      .set({
        dayId,
        paidBy,
        description,
        amountMinor,
        currency,
        splitType,
        notes,
        ...touch(),
      })
      .where(eq(expense.id, expenseId));

    await tx.delete(expenseSplit).where(eq(expenseSplit.expenseId, expenseId));
    await tx.insert(expenseSplit).values(
      splits.map((s) => ({
        expenseId,
        userId: s.userId,
        owedAmountMinor: s.owedAmountMinor,
      })),
    );
  });

  after(() =>
    notifyParticipants({
      tripId,
      tripName: access.trip.name,
      fromName: access.viewer.name,
      fromUserId: access.viewer.id,
      description,
      currency,
      splits,
      members: access.members,
    }),
  );

  revalidatePath(`/trip/${tripId}/money`);
  return {};
}

export async function deleteExpense(formData: FormData): Promise<void> {
  const tripId = Number(formData.get("tripId"));
  const expenseId = Number(formData.get("expenseId"));
  await requireTripAccess(tripId);

  // Soft-delete only the expense; its splits are filtered out at read time by
  // joining on the expense's deletedAt (ticket 16), so they need no touching.
  await db
    .update(expense)
    .set({ deletedAt: new Date(), ...touch() })
    .where(and(eq(expense.id, expenseId), eq(expense.tripId, tripId)));

  revalidatePath(`/trip/${tripId}/money`);
}

export async function toggleSettled(formData: FormData): Promise<void> {
  const tripId = Number(formData.get("tripId"));
  const splitId = Number(formData.get("splitId"));
  const access = await requireTripAccess(tripId);

  const row = await db
    .select({
      id: expenseSplit.id,
      userId: expenseSplit.userId,
      settledAt: expenseSplit.settledAt,
      paidBy: expense.paidBy,
      expenseTripId: expense.tripId,
    })
    .from(expenseSplit)
    .innerJoin(expense, eq(expense.id, expenseSplit.expenseId))
    .where(and(eq(expenseSplit.id, splitId), isNull(expense.deletedAt)))
    .get();

  if (!row || row.expenseTripId !== tripId) return;

  // A member may mark their OWN split settled; the person who paid may also
  // mark a split against them settled, since they're the one who'd know
  // whether the money actually changed hands off-app (ticket 16).
  const allowed = row.userId === access.viewer.id || row.paidBy === access.viewer.id;
  if (!allowed) return;

  await db
    .update(expenseSplit)
    .set({ settledAt: row.settledAt ? null : new Date(), ...touch() })
    .where(eq(expenseSplit.id, splitId));

  revalidatePath(`/trip/${tripId}/money`);
}
