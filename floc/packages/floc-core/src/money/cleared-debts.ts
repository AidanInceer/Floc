import type { SettleRow } from "./group-settle";
import { formatMoney } from "./money";

/** One debt a payment clears (#461). The web receipt and the phone's confirm word it each their own way. */
export type ClearedDebt = {
  key: string;
  /** The viewer is the one who owed it. */
  youOwe: boolean;
  /** The other person in this debt. */
  otherId: string;
  /** In the debt's own currency. */
  cleared: string;
  /** What it costs in the payment's currency, when that is not the debt's. */
  inPay: string | null;
  /** It runs against the payment, so it comes off the figure. */
  against: boolean;
};

export function clearedDebts(row: SettleRow, viewerId: string): ClearedDebt[] {
  return row.parts.map((p) => {
    const youOwe = p.fromUserId === viewerId;
    return {
      key: `${p.fromUserId}-${p.clearsCurrency ?? p.currency}`,
      youOwe,
      otherId: youOwe ? p.toUserId : p.fromUserId,
      cleared: formatMoney(p.clearsAmountMinor ?? p.amountMinor, p.clearsCurrency ?? p.currency),
      inPay: p.clearsCurrency ? formatMoney(p.amountMinor, p.currency) : null,
      against: p.fromUserId !== row.payer,
    };
  });
}
