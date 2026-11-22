import { currencySymbol, minorPerMajor, type Currency } from "../currency";
import type { BudgetFit, LineProgress, Range } from "./budget";

export type AmountField = "figure" | "budget";

export const AMOUNT_FIELD_WORDS: Record<AmountField, string> = { figure: "Your figure", budget: "Line budget" };
export const BUDGET_THIS_LINE = "Budget for this line";
export const WAITING_LINES_TITLE = "Not in your budget";
export const ESTIMATE_LOCK_TITLE = "Cost estimate and budget";
export const ESTIMATE_LOCK_BODY = "See roughly what this trip will cost you, set your own budget and track it. Only you see it. A Floc Pro feature.";

export function wholeMoney(minor: number, currency: Currency): string {
  const amount = Math.round(minor / minorPerMajor(currency)).toLocaleString("en-GB");
  const symbol = currencySymbol(currency);
  return symbol ? `${symbol}${amount}` : `${currency} ${amount}`;
}

export function wholeRange(range: Range, currency: Currency): string {
  return range[0] === range[1] ? wholeMoney(range[0], currency) : `${wholeMoney(range[0], currency)}–${wholeMoney(range[1], currency)}`;
}

export function fitWords(fit: BudgetFit, currency: Currency): string {
  if (fit.kind === "fits") return "Fits";
  if (fit.kind === "tight") return `Tight · up to ${wholeMoney(fit.short, currency)} short`;
  return `Over by ${wholeMoney(fit.by, currency)}`;
}

export function progressWords(progress: LineProgress, currency: Currency): string {
  switch (progress.kind) {
    case "no-guide": return "No guide";
    case "not-started": return "Not started";
    case "in-range": return "In range";
    case "to-go": return `${wholeRange(progress.range, currency)} to go`;
    case "over": return `Over by ${wholeMoney(progress.by, currency)}`;
  }
}
