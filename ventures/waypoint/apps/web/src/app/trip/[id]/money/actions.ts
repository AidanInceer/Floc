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
import { and, eq, inArray, isNull } from "drizzle-orm";

import { db } from "@/db";
import { expense, expenseSplit, user } from "@/db/schema";
import type { Currency, SplitType } from "@/db/schema";
import { requireTripAccess } from "@/lib/access";
import { touch } from "@/lib/unlocks";
import { computeSplits, formatMoney, parseMoney } from "@/lib/money";
import type { SplitInput } from "@/lib/money";
import { emails, sendEmail } from "@/lib/email";

export type ActionState = { error?: string };

function parseParticipants(formData: FormData, splitType: SplitType): SplitInput[] {
  // (Return type spelled out so `SplitInput` is a used import, not just inferred.)
  const ids = formData.getAll("participant").map(String).filter(Boolean);
  return ids.map((userId) => {
    if (splitType === "even") return { userId };
    const raw = formData.get(`value_${userId}`);
    return { userId, value: raw ? Number(raw) : 0 };
  });
}

function readExpenseFields(formData: FormData) {
  const description = String(formData.get("description") ?? "").trim();
  const currency = String(formData.get("currency") ?? "") as Currency;
  const splitType = String(formData.get("splitType") ?? "") as SplitType;
  const paidBy = String(formData.get("paidBy") ?? "");
  const dayIdRaw = formData.get("dayId");
  const dayId = dayIdRaw ? Number(dayIdRaw) : null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  return { description, currency, splitType, paidBy, dayId, notes };
}

/** Emails everyone in the split except whoever is at the keyboard right now. */
async function notifyParticipants(args: {
  tripId: number;
  tripName: string;
  fromName: string;
  fromUserId: string;
  description: string;
  currency: Currency;
  splits: { userId: string; owedAmountMinor: number }[];
}) {
  const others = args.splits.filter((s) => s.userId !== args.fromUserId);
  if (others.length === 0) return;

  const rows = await db
    .select({ id: user.id, email: user.email })
    .from(user)
    .where(inArray(user.id, others.map((s) => s.userId)))
    .all();
  const emailById = new Map(rows.map((r) => [r.id, r.email]));

  await Promise.all(
    others.map((s) => {
      const to = emailById.get(s.userId);
      if (!to) return Promise.resolve();
      return sendEmail(
        emails.expenseAdded({
          to,
          toUserId: s.userId,
          tripId: args.tripId,
          tripName: args.tripName,
          fromName: args.fromName,
          description: args.description,
          share: formatMoney(s.owedAmountMinor, args.currency),
        }),
      );
    }),
  );
}

export async function addExpense(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const tripId = Number(formData.get("tripId"));
  const access = await requireTripAccess(tripId);
  const { description, currency, splitType, paidBy, dayId, notes } =
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
  try {
    splits = computeSplits(amountMinor, splitType, parseParticipants(formData, splitType));
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

  await notifyParticipants({
    tripId,
    tripName: access.trip.name,
    fromName: access.viewer.name,
    fromUserId: access.viewer.id,
    description,
    currency,
    splits,
  });

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
  const { description, currency, splitType, paidBy, dayId, notes } =
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
  try {
    splits = computeSplits(amountMinor, splitType, parseParticipants(formData, splitType));
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

  await notifyParticipants({
    tripId,
    tripName: access.trip.name,
    fromName: access.viewer.name,
    fromUserId: access.viewer.id,
    description,
    currency,
    splits,
  });

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
