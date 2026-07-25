// Money is never a float. Everything here is integer minor units (pence),
// per ADR 0007 — the ledger records who owes whom and never moves funds.

export type Minor = number;

export function fmt(minor: Minor, currency = "GBP"): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    minimumFractionDigits: Number.isInteger(minor / 100) ? 0 : 2,
  }).format(minor / 100);
}

/** Signed, for balances: −£148 reads differently from £148. */
export function fmtSigned(minor: Minor, currency = "GBP"): string {
  const s = fmt(Math.abs(minor), currency);
  if (minor === 0) return s;
  return (minor > 0 ? "+" : "−") + s;
}

export function parseAmount(input: string): Minor | null {
  const cleaned = input.replace(/[£,\s]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const [whole, frac = ""] = cleaned.split(".");
  return Number(whole) * 100 + Number(frac.padEnd(2, "0"));
}

/**
 * Split a total into n whole pennies. The remainder goes to the first few
 * people rather than vanishing — the parts always sum back to the total.
 */
export function splitEvenly(total: Minor, n: number): Minor[] {
  if (n <= 0) return [];
  const base = Math.floor(total / n);
  const rem = total - base * n;
  return Array.from({ length: n }, (_, i) => base + (i < rem ? 1 : 0));
}

export type Balance = { memberId: string; net: Minor };
export type Transfer = { from: string; to: string; amount: Minor };

/**
 * Simplified settle-up: greedily match the biggest debtor to the biggest
 * creditor. Never more than n−1 transfers, usually far fewer.
 */
export function settleUp(balances: Balance[]): Transfer[] {
  const debtors = balances.filter((b) => b.net < 0).map((b) => ({ ...b }));
  const creditors = balances.filter((b) => b.net > 0).map((b) => ({ ...b }));
  debtors.sort((a, b) => a.net - b.net);
  creditors.sort((a, b) => b.net - a.net);

  const out: Transfer[] = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const owe = -debtors[i].net;
    const due = creditors[j].net;
    const amount = Math.min(owe, due);
    if (amount > 0) out.push({ from: debtors[i].memberId, to: creditors[j].memberId, amount });
    debtors[i].net += amount;
    creditors[j].net -= amount;
    if (debtors[i].net === 0) i++;
    if (creditors[j].net === 0) j++;
  }
  return out;
}
