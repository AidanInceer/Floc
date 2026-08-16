"use server";

// An expense write always rewrites expense + the whole expense_split set in
// one transaction (writeExpense, server/money.ts) — last-write-wins, never a
// partial-row merge (ticket 12). Any member may add/edit/delete (ticket 01).
import { after } from "next/server";

import type { Currency } from "@/db/schema";
import { capRequiredText, capText } from "@/lib/text";
import { requireTripAccess } from "@/server/access";
import {
  emailsForUsers,
  findLiveExpense,
  findSettleableSplit,
  revalidateMoney,
  softDeleteExpense,
  toggleSplitSettled,
  writeExpense,
} from "@/server/money";
import type { WritableSplitType } from "@/lib/money";
import {
  computeSplits,
  formatMoney,
  parseMoney,
  resolveWeightedSplit,
} from "@/lib/money";
import type { SplitInput, WeightedInput } from "@/lib/money";
import { emails, sendEmails } from "@/server/email";

export type ActionState = { error?: string };

// Form posts shares + optional pin per participant (ticket 85);
// resolveWeightedSplit maps that to the stored split_type. Excluded people
// simply aren't in `participant` — no row, not a zero row.
function parseSplit(
  formData: FormData,
  amountMinor: number,
): { splitType: WritableSplitType; participants: SplitInput[] } {
  const ids = formData.getAll("participant").map(String).filter(Boolean);
  const rows: WeightedInput[] = ids.map((userId) => {
    const rawPin = String(formData.get(`pin_${userId}`) ?? "").trim();
    const rawShares = String(formData.get(`shares_${userId}`) ?? "1").trim();
    return {
      userId,
      shares: rawShares === "" ? 0 : Number(rawShares),
      // Empty box = not pinned; a typed 0.00 is a real pin of nothing.
      pinnedMinor: rawPin === "" ? null : parseMoney(rawPin),
    };
  });
  return resolveWeightedSplit(amountMinor, rows);
}

function readExpenseFields(formData: FormData) {
  const description = capRequiredText(formData.get("description"), "expenseDescription");
  const currency = String(formData.get("currency") ?? "") as Currency;
  const paidBy = String(formData.get("paidBy") ?? "");
  const dayIdRaw = formData.get("dayId");
  const dayId = dayIdRaw ? Number(dayIdRaw) : null;
  const notes = capText(formData.get("notes"), "expenseNotes");
  return { description, currency, paidBy, dayId, notes };
}

// Emails everyone in the split except the actor. Addresses come from the
// already-loaded roster; `user` is queried only for a participant kicked
// since the expense was written, whose split rows survive by design.
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
    const rows = await emailsForUsers(unknown.map((s) => s.userId));
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
  let splitType: WritableSplitType;
  try {
    const resolved = parseSplit(formData, amountMinor);
    splitType = resolved.splitType;
    splits = computeSplits(amountMinor, splitType, resolved.participants);
  } catch (err) {
    return { error: (err as Error).message };
  }

  await writeExpense({
    tripId: access.trip.id,
    createdBy: access.viewer.id,
    fields: { dayId, paidBy, description, amountMinor, currency, splitType, notes },
    splits,
  });

  // Mail isn't part of the write; after() runs it once the response flushes.
  after(() =>
    notifyParticipants({
      tripId: access.trip.id,
      tripName: access.trip.name,
      fromName: access.viewer.name,
      fromUserId: access.viewer.id,
      description,
      currency,
      splits,
      members: access.members,
    }),
  );

  revalidateMoney(access.trip.id);
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

  const existing = await findLiveExpense(access.trip.id, expenseId);
  if (!existing) return { error: "That cost no longer exists." };

  let amountMinor: number;
  try {
    amountMinor = parseMoney(String(formData.get("amount") ?? ""));
  } catch (err) {
    return { error: (err as Error).message };
  }

  let splits;
  let splitType: WritableSplitType;
  try {
    const resolved = parseSplit(formData, amountMinor);
    splitType = resolved.splitType;
    splits = computeSplits(amountMinor, splitType, resolved.participants);
  } catch (err) {
    return { error: (err as Error).message };
  }

  // Whole-expense last-write-wins: split set replaced, not merged (ticket 12).
  await writeExpense({
    tripId: access.trip.id,
    expenseId: existing.id,
    createdBy: access.viewer.id,
    fields: { dayId, paidBy, description, amountMinor, currency, splitType, notes },
    splits,
  });

  after(() =>
    notifyParticipants({
      tripId: access.trip.id,
      tripName: access.trip.name,
      fromName: access.viewer.name,
      fromUserId: access.viewer.id,
      description,
      currency,
      splits,
      members: access.members,
    }),
  );

  revalidateMoney(access.trip.id);
  return {};
}

export async function deleteExpense(formData: FormData): Promise<void> {
  const tripId = Number(formData.get("tripId"));
  const expenseId = Number(formData.get("expenseId"));
  const access = await requireTripAccess(tripId);

  await softDeleteExpense(access.trip.id, expenseId);

  revalidateMoney(access.trip.id);
}

export async function toggleSettled(formData: FormData): Promise<void> {
  const tripId = Number(formData.get("tripId"));
  const splitId = Number(formData.get("splitId"));
  const access = await requireTripAccess(tripId);

  const row = await findSettleableSplit(splitId);
  if (!row || row.expenseTripId !== access.trip.id) return;

  // Owner of the split, or whoever paid (they'd know if it changed hands
  // off-app), may mark it settled (ticket 16).
  const allowed = row.userId === access.viewer.id || row.paidBy === access.viewer.id;
  if (!allowed) return;

  await toggleSplitSettled(splitId, !row.settledAt);

  revalidateMoney(access.trip.id);
}
