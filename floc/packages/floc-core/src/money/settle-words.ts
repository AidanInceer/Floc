import type { SettleRow } from "./group-settle";

export const SETTLE_OWE_TITLE = "You owe";
export const SETTLE_OWED_TITLE = "You are owed";
export const SETTLE_OTHERS_TITLE = "Between the others";

export function settleSides(rows: SettleRow[], viewerId: string | undefined): { owe: SettleRow[]; owed: SettleRow[]; others: SettleRow[] } {
  return {
    owe: rows.filter((r) => r.payer === viewerId),
    owed: rows.filter((r) => r.payee === viewerId),
    others: rows.filter((r) => r.payer !== viewerId && r.payee !== viewerId),
  };
}
