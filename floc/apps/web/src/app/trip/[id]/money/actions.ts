"use server";

// An expense write always rewrites expense + the whole expense_split set in
// one transaction (writeExpense, server/money.ts) — last-write-wins, never a
// partial-row merge (ticket 12). Any member may add/edit/delete (ticket 01).
import { after } from "next/server";

import type { Currency } from "@/db/schema";
import { capRequiredText, capText } from "@floc/core/text/text";
import { CURRENCIES, minorPerMajor } from "@floc/core/money/currency";
import { getHomeRates } from "@/server/money/fx";
import {
  DEFAULT_CATEGORY,
  isExpenseCategory,
} from "@floc/core/money/expense-category";
import type { ExpenseCategory } from "@floc/core/money/expense-category";
import { requireTripAccess } from "@/server/access";
import {
  emailsForUsers,
  findLiveExpense,
  findLiveSettlement,
  softDeleteExpense,
  softDeleteSettlement,
  writeExpense,
  writeSettlement,
} from "@/server/money/money";
import type { WritableSplitType } from "@floc/core/money/money";
import {
  computeSplits,
  formatMoney,
  maxExpenseMinor,
  parseMoney,
  convertMinor,
  resolveWeightedSplit,
} from "@floc/core/money/money";
import type { SplitInput, WeightedInput } from "@floc/core/money/money";
import { emails, sendEmails } from "@/server/auth/email";
import { refresh } from "@/server/freshness";

export type ActionState = { error?: string };

// Form posts shares + optional pin per participant (ticket 85);
// resolveWeightedSplit maps that to the stored split_type. Excluded people
// simply aren't in `participant` — no row, not a zero row.
function parseSplit(
  formData: FormData,
  amountMinor: number,
  currency: Currency,
): { splitType: WritableSplitType; participants: SplitInput[] } {
  const ids = formData.getAll("participant").map(String).filter(Boolean);
  const rows: WeightedInput[] = ids.map((userId) => {
    const rawPin = String(formData.get(`pin_${userId}`) ?? "").trim();
    const rawShares = String(formData.get(`shares_${userId}`) ?? "1").trim();
    return {
      userId,
      shares: rawShares === "" ? 0 : Number(rawShares),
      // Empty box = not pinned; a typed 0.00 is a real pin of nothing.
      pinnedMinor: rawPin === "" ? null : parseMoney(rawPin, currency),
    };
  });
  return resolveWeightedSplit(amountMinor, rows, currency);
}

// Parses the amount and holds it to a sane, positive range — the arithmetic
// ceiling in lib/money is a safety net, not a product limit.
function readAmount(
  formData: FormData,
  currency: Currency,
): { amountMinor: number } | { error: string } {
  let amountMinor: number;
  try {
    amountMinor = parseMoney(String(formData.get("amount") ?? ""), currency);
  } catch (err) {
    return { error: (err as Error).message };
  }
  if (amountMinor <= 0) return { error: "Enter an amount above zero." };
  if (amountMinor > maxExpenseMinor(currency)) {
    return { error: `Keep an expense under ${formatMoney(maxExpenseMinor(currency), currency)}.` };
  }
  return { amountMinor };
}

function readExpenseFields(formData: FormData) {
  const description = capRequiredText(formData.get("description"), "expenseDescription");
  const currency = String(formData.get("currency") ?? "") as Currency;
  const paidBy = String(formData.get("paidBy") ?? "");
  const dayIdRaw = formData.get("dayId");
  const dayId = dayIdRaw ? Number(dayIdRaw) : null;
  const notes = capText(formData.get("notes"), "expenseNotes");
  const rawCategory = formData.get("category");
  const category: ExpenseCategory = isExpenseCategory(rawCategory)
    ? rawCategory
    : DEFAULT_CATEGORY;
  return { description, currency, paidBy, dayId, notes, category };
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
  const { description, currency, paidBy, dayId, notes, category } =
    readExpenseFields(formData);

  if (!description) return { error: "Give the expense a description." };
  if (!paidBy) return { error: "Say who paid." };
  if (!CURRENCIES.includes(currency)) return { error: "Pick a currency." };

  const parsed = readAmount(formData, currency);
  if ("error" in parsed) return { error: parsed.error };
  const amountMinor = parsed.amountMinor;

  let splits;
  let splitType: WritableSplitType;
  try {
    const resolved = parseSplit(formData, amountMinor, currency);
    splitType = resolved.splitType;
    splits = computeSplits(amountMinor, splitType, resolved.participants);
  } catch (err) {
    return { error: (err as Error).message };
  }
  if (splits.some((s) => s.owedAmountMinor < 0)) {
    return { error: "A share can't be negative." };
  }

  await writeExpense({
    tripId: access.trip.id,
    createdBy: access.viewer.id,
    fields: { dayId, paidBy, description, amountMinor, currency, splitType, category, notes },
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

  refresh({ kind: "money", tripId: access.trip.id });
  return {};
}

export async function updateExpense(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const tripId = Number(formData.get("tripId"));
  const expenseId = Number(formData.get("expenseId"));
  const access = await requireTripAccess(tripId);
  const { description, currency, paidBy, dayId, notes, category } =
    readExpenseFields(formData);

  if (!description) return { error: "Give the expense a description." };
  if (!paidBy) return { error: "Say who paid." };
  if (!CURRENCIES.includes(currency)) return { error: "Pick a currency." };

  const existing = await findLiveExpense(access.trip.id, expenseId);
  if (!existing) return { error: "That expense no longer exists." };

  const parsed = readAmount(formData, currency);
  if ("error" in parsed) return { error: parsed.error };
  const amountMinor = parsed.amountMinor;

  let splits;
  let splitType: WritableSplitType;
  try {
    const resolved = parseSplit(formData, amountMinor, currency);
    splitType = resolved.splitType;
    splits = computeSplits(amountMinor, splitType, resolved.participants);
  } catch (err) {
    return { error: (err as Error).message };
  }
  if (splits.some((s) => s.owedAmountMinor < 0)) {
    return { error: "A share can't be negative." };
  }

  // Whole-expense last-write-wins: split set replaced, not merged (ticket 12).
  await writeExpense({
    tripId: access.trip.id,
    expenseId: existing.id,
    createdBy: access.viewer.id,
    fields: { dayId, paidBy, description, amountMinor, currency, splitType, category, notes },
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

  refresh({ kind: "money", tripId: access.trip.id });
  return {};
}

export async function deleteExpense(formData: FormData): Promise<void> {
  const tripId = Number(formData.get("tripId"));
  const expenseId = Number(formData.get("expenseId"));
  const access = await requireTripAccess(tripId);

  await softDeleteExpense(access.trip.id, expenseId);

  refresh({ kind: "money", tripId: access.trip.id });
}

/**
 * The paid side of a cross-currency settlement. The rate is fetched here, not
 * accepted from the form — a client-posted rate would be a client-posted
 * balance. When no rate can be had at all the payer types the amount they
 * actually handed over and the implied rate is recorded with no date, because
 * there is no publication to point at (ticket 253).
 */
async function readCrossPayment(
  clearsCurrency: Currency,
  payCurrency: Currency,
  clearsAmountMinor: number,
  formData: FormData,
): Promise<{ paidMinor: number; rate: number; date: string | null } | { error: string }> {
  const rates = await getHomeRates(clearsCurrency);
  const rate = rates?.toHome[payCurrency] || null;

  if (rate !== null) {
    const paidMinor = convertMinor(clearsAmountMinor, clearsCurrency, payCurrency, 1 / rate);
    if (paidMinor <= 0) return { error: "That converts to nothing — check the amount." };
    return { paidMinor, rate, date: rates?.date ?? null };
  }

  let paidMinor: number;
  try {
    paidMinor = parseMoney(String(formData.get("payAmount") ?? ""), payCurrency);
  } catch {
    return { error: `No rate available — type what you paid in ${payCurrency}.` };
  }
  if (paidMinor <= 0) return { error: "Enter an amount above zero." };
  return {
    paidMinor,
    rate:
      (clearsAmountMinor / minorPerMajor(clearsCurrency)) /
      (paidMinor / minorPerMajor(payCurrency)),
    date: null,
  };
}

// Records a settlement pre-filled from a simplified transfer, amount/person
// editable. Either party to it may record it (money overhaul).
export async function recordSettlement(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const tripId = Number(formData.get("tripId"));
  const access = await requireTripAccess(tripId);

  const fromUserId = String(formData.get("fromUserId") ?? "");
  const toUserId = String(formData.get("toUserId") ?? "");
  const currency = String(formData.get("currency") ?? "") as Currency;

  if (!CURRENCIES.includes(currency)) return { error: "Pick a currency." };
  if (!fromUserId || !toUserId || fromUserId === toUserId) {
    return { error: "A settlement is between two different people." };
  }

  const memberIds = new Set(access.members.map((m) => m.userId));
  if (!memberIds.has(fromUserId) || !memberIds.has(toUserId)) {
    return { error: "Both people must be on the trip." };
  }
  // Only a party to the transfer may record it.
  if (access.viewer.id !== fromUserId && access.viewer.id !== toUserId) {
    return { error: "Only the payer or receiver can record this." };
  }

  let amountMinor: number;
  try {
    amountMinor = parseMoney(String(formData.get("amount") ?? ""), currency);
  } catch (err) {
    return { error: (err as Error).message };
  }
  if (amountMinor <= 0) return { error: "Enter an amount above zero." };

  // Paying in a different currency from the debt (ticket 253). The debt side
  // is what moves the balance; the paid side and the rate are a snapshot of
  // this one payment, never read back to convert anything else.
  const payCurrency = String(formData.get("payCurrency") ?? currency) as Currency;
  if (!CURRENCIES.includes(payCurrency)) return { error: "Pick a currency." };

  if (payCurrency === currency) {
    await writeSettlement({
      tripId: access.trip.id,
      createdBy: access.viewer.id,
      fromUserId,
      toUserId,
      amountMinor,
      currency,
    });
    refresh({ kind: "money", tripId: access.trip.id });
    return {};
  }

  const cross = await readCrossPayment(currency, payCurrency, amountMinor, formData);
  if ("error" in cross) return { error: cross.error };

  await writeSettlement({
    tripId: access.trip.id,
    createdBy: access.viewer.id,
    fromUserId,
    toUserId,
    amountMinor: cross.paidMinor,
    currency: payCurrency,
    clearsAmountMinor: amountMinor,
    clearsCurrency: currency,
    fxRate: cross.rate,
    fxRateDate: cross.date,
  });

  refresh({ kind: "money", tripId: access.trip.id });
  return {};
}

// Reverts a settlement — soft-delete, so the balance recomputes as if the
// money never moved. Anyone on the trip may delete any row (money overhaul).
export async function deleteSettlement(formData: FormData): Promise<void> {
  const tripId = Number(formData.get("tripId"));
  const settlementId = Number(formData.get("settlementId"));
  const access = await requireTripAccess(tripId);

  const row = await findLiveSettlement(access.trip.id, settlementId);
  if (!row) return;

  await softDeleteSettlement(access.trip.id, settlementId);

  refresh({ kind: "money", tripId: access.trip.id });
}
