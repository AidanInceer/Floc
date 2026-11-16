import type { Currency } from "../currency";
import { NO_AMOUNT, NO_SHARES } from "../expense-rules";
import { computeSplits, parseMoney, resolveWeightedSplit, type WritableSplitType } from "../money";

export type SplitMode = "equally" | "exact" | "shares";

export const SPLIT_MODES: { key: SplitMode; label: string }[] = [
  { key: "equally", label: "Equally" },
  { key: "exact", label: "Exact" },
  { key: "shares", label: "Shares" },
];

export type SplitBox = { userId: string; shares: number; pin: string };

export function splitBox(mode: SplitMode, userId: string, row: { shares: number; pin: string }): SplitBox {
  if (mode === "exact") return { userId, shares: 1, pin: row.pin };
  if (mode === "shares") return { userId, shares: row.shares, pin: "" };
  return { userId, shares: 1, pin: "" };
}

export type SplitResult =
  | { ok: true; amountMinor: number; splitType: WritableSplitType; splits: { userId: string; owedAmountMinor: number }[] }
  | { ok: false; problem: string };

export function splitFromForm(amount: string, boxes: SplitBox[], currency: Currency): SplitResult {
  if (boxes.every((box) => box.shares === 0 && box.pin.trim() === "")) return { ok: false, problem: NO_SHARES };
  let amountMinor: number;
  try {
    amountMinor = parseMoney(amount, currency);
  } catch {
    return { ok: false, problem: NO_AMOUNT };
  }
  if (amountMinor <= 0) return { ok: false, problem: NO_AMOUNT };

  try {
    const rows = boxes.map((box) => ({
      userId: box.userId,
      shares: box.shares,
      pinnedMinor: box.pin.trim() === "" ? null : parseMoney(box.pin, currency),
    }));
    const { splitType, participants } = resolveWeightedSplit(amountMinor, rows, currency);
    return { ok: true, amountMinor, splitType, splits: computeSplits(amountMinor, splitType, participants) };
  } catch (err) {
    return { ok: false, problem: (err as Error).message };
  }
}
