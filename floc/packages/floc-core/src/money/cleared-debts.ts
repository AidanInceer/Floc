import type { SettleRow } from "./group-settle";
import { formatMoney } from "./money";

export type ClearedDebt = {
  key: string;
  youOwe: boolean;
  otherId: string;
  cleared: string;
  inPay: string | null;
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
