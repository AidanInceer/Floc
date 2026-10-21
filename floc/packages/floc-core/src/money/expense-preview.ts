import { minorPerMajor, type Currency } from "./currency";
import { computeSplits, maxExpenseMinor } from "./money";

type DraftShare = { userId: string; shares: number; pin: string };

function draftMinor(raw: string, currency: Currency): number | null {
  if (!raw.trim()) return null;
  const amount = Number(raw.replace(/[^\d.-]/g, ""));
  return Number.isFinite(amount) ? Math.round(amount * minorPerMajor(currency)) : null;
}

export function previewExpenseSplit(amount: string, rows: DraftShare[], currency: Currency) {
  const amountMinor = Math.max(0, Math.min(draftMinor(amount, currency) ?? 0, maxExpenseMinor(currency)));
  const parsed = rows.map((row) => ({ ...row, pinnedMinor: draftMinor(row.pin, currency) }));
  const pinnedTotal = parsed.reduce((sum, row) => sum + (row.pinnedMinor ?? 0), 0);
  const remainder = amountMinor - pinnedTotal;
  const unpinned = parsed.filter((row) => row.pinnedMinor === null);
  const shareTotal = unpinned.reduce((sum, row) => sum + row.shares, 0);
  const rest = remainder > 0 && shareTotal > 0
    ? computeSplits(remainder, "shares", unpinned.map((row) => ({ userId: row.userId, value: row.shares })))
    : unpinned.map((row) => ({ userId: row.userId, owedAmountMinor: 0 }));
  const amounts: Record<string, number> = Object.fromEntries(rest.map((row) => [row.userId, row.owedAmountMinor]));
  for (const row of parsed) {
    if (row.pinnedMinor !== null) amounts[row.userId] = row.pinnedMinor;
  }
  const allocated = Object.values(amounts).reduce((sum, value) => sum + value, 0);
  const isEven = parsed.length > 0 && unpinned.length === parsed.length &&
    parsed.every((row) => row.shares === parsed[0].shares && row.shares > 0);

  return {
    amountMinor,
    amounts,
    allocated,
    leftover: amountMinor - allocated,
    evenEach: isEven ? amounts[parsed[0].userId] : null,
  };
}
