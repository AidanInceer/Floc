"use server";

// An expense write always rewrites expense + the whole expense_split set in
// one transaction (writeExpense, server/money/money.ts) — last-write-wins, never a
// partial-row merge (ticket 12). Any member may add/edit/delete (ticket 01).
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
import { expenseFieldsProblem, NO_AMOUNT, transferPartiesProblem } from "@floc/core/money/expense-rules";
import {
  findLiveSettlement,
  rewriteSettlement,
  softDeleteSettlement,
  type Transfer,
} from "@/server/money/money";
import { settleWithFor } from "@/server/money/settle-up";
import { recordTransfers, removeExpense, saveExpense } from "@/server/money/money-save";
import { parseMoney, convertMinor } from "@floc/core/money/money";
import { splitFromForm, type SplitBox } from "@floc/core/money/expense/expense-form";
import { refresh } from "@/server/freshness";

export type ActionState = { error?: string };

// Form posts shares + optional pin per participant (ticket 85), already
// resolved for the mode. Excluded people simply aren't in `participant`.
function readSplitBoxes(formData: FormData): SplitBox[] {
  return formData.getAll("participant").map(String).filter(Boolean).map((userId) => {
    const rawShares = String(formData.get(`shares_${userId}`) ?? "1").trim();
    return {
      userId,
      shares: rawShares === "" ? 0 : Number(rawShares),
      pin: String(formData.get(`pin_${userId}`) ?? ""),
    };
  });
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

// One path for add and edit: an edit replaces the split set whole, never merges (ticket 12).
async function submitExpense(formData: FormData, expenseId?: number): Promise<ActionState> {
  const access = await requireTripAccess(Number(formData.get("tripId")));
  const { description, currency, paidBy, dayId, notes, category } =
    readExpenseFields(formData);

  const fieldsProblem = expenseFieldsProblem({ description, paidBy, currency });
  if (fieldsProblem) return { error: fieldsProblem };

  const split = splitFromForm(String(formData.get("amount") ?? ""), readSplitBoxes(formData), currency);
  if (!split.ok) return { error: split.problem };
  const { amountMinor, splitType, splits } = split;

  const refusal = await saveExpense(access, {
    expenseId,
    description,
    amountMinor,
    currency,
    category,
    splitType,
    paidBy,
    dayId,
    notes,
    splits,
  });
  return refusal ? { error: refusal.message } : {};
}

export async function addExpense(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return submitExpense(formData);
}

export async function updateExpense(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return submitExpense(formData, Number(formData.get("expenseId")));
}

export async function deleteExpense(formData: FormData): Promise<void> {
  const tripId = Number(formData.get("tripId"));
  const expenseId = Number(formData.get("expenseId"));
  const access = await requireTripAccess(tripId);

  await removeExpense(access, expenseId);
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
  if (paidMinor <= 0) return { error: NO_AMOUNT };
  return {
    paidMinor,
    rate:
      (clearsAmountMinor / minorPerMajor(clearsCurrency)) /
      (paidMinor / minorPerMajor(payCurrency)),
    date: null,
  };
}

type Access = Awaited<ReturnType<typeof requireTripAccess>>;

// The record rules, shared by record and edit (#361).
async function readTransfer(access: Access, formData: FormData): Promise<Transfer | { error: string }> {
  const fromUserId = String(formData.get("fromUserId") ?? "");
  const toUserId = String(formData.get("toUserId") ?? "");
  const currency = String(formData.get("currency") ?? "") as Currency;

  if (!CURRENCIES.includes(currency)) return { error: "Pick a currency." };
  const partyProblem = transferPartiesProblem(
    new Set(access.members.map((m) => m.userId)),
    access.viewer.id,
    fromUserId,
    toUserId,
  );
  if (partyProblem) return { error: partyProblem.message };

  let amountMinor: number;
  try {
    amountMinor = parseMoney(String(formData.get("amount") ?? ""), currency);
  } catch (err) {
    return { error: (err as Error).message };
  }
  if (amountMinor <= 0) return { error: NO_AMOUNT };

  // Paying in a different currency from the debt (ticket 253). The debt side
  // is what moves the balance; the paid side and the rate are a snapshot of
  // this one payment, never read back to convert anything else.
  const payCurrency = String(formData.get("payCurrency") ?? currency) as Currency;
  if (!CURRENCIES.includes(payCurrency)) return { error: "Pick a currency." };

  if (payCurrency === currency) return { fromUserId, toUserId, amountMinor, currency };

  const cross = await readCrossPayment(currency, payCurrency, amountMinor, formData);
  if ("error" in cross) return { error: cross.error };

  return {
    fromUserId,
    toUserId,
    amountMinor: cross.paidMinor,
    currency: payCurrency,
    clearsAmountMinor: amountMinor,
    clearsCurrency: currency,
    fxRate: cross.rate,
    fxRateDate: cross.date,
  };
}

// Records a settlement pre-filled from a simplified transfer, amount/person
// editable. Either party to it may record it (money overhaul).
export async function recordSettlement(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const access = await requireTripAccess(Number(formData.get("tripId")));
  const transfer = await readTransfer(access, formData);
  if ("error" in transfer) return transfer;

  const refusal = await recordTransfers(access, [transfer]);
  return refusal ? { error: refusal.message } : {};
}

// A party to the recorded payment may correct it; last write wins (#361).
export async function editSettlement(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const access = await requireTripAccess(Number(formData.get("tripId")));
  const settlementId = Number(formData.get("settlementId"));

  const existing = await findLiveSettlement(access.trip.id, settlementId);
  if (!existing) return { error: "That settlement has been undone." };
  if (access.viewer.id !== existing.fromUserId && access.viewer.id !== existing.toUserId) {
    return { error: "Only the payer or receiver can change this." };
  }

  const transfer = await readTransfer(access, formData);
  if ("error" in transfer) return transfer;

  if (!(await rewriteSettlement(access.trip.id, settlementId, transfer))) {
    return { error: "That settlement has been undone." };
  }
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

// One payment clears everything between the viewer and one person (#461, #463). The rows are recomputed here,
// never read from the form, so the figure the payer confirmed is the one the ledger says now.
export async function settlePair(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const access = await requireTripAccess(Number(formData.get("tripId")));
  const refusal = await settleWithFor(access, String(formData.get("otherUserId") ?? ""));
  return refusal ? { error: refusal.message } : {};
}
