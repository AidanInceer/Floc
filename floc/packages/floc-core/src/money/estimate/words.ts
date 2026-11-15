import { currencySymbol, minorPerMajor, type Currency } from "../currency";
import type { BudgetFit, LineProgress, Range } from "./budget";

/** An estimate figure in whole units: a guide is a rough range, so pence would claim a precision it does not have. */
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
