/**
 * Per-currency balances and settle-up suggestions (ticket 16). Balances are
 * derived at read time from `expense_split` sums — there is no stored
 * balance table (ticket 04) — and currencies are never mixed into one total.
 */
import { Badge, Card, CardHeader, Stack } from "@/components/ui";
import { computeBalances, formatMoney, suggestSettlements } from "@/lib/money";
import type { LedgerLine } from "@/lib/money";
import type { Currency } from "@/db/schema";
import { CURRENCIES } from "@/db/schema";

export function BalanceSummary({
  lines,
  userNames,
}: {
  lines: LedgerLine[];
  userNames: Record<string, string>;
}) {
  const balances = computeBalances(lines);
  const name = (userId: string) => userNames[userId] ?? "Someone who left";

  const active = CURRENCIES.filter(
    (c) => Object.keys(balances[c]).length > 0,
  );

  if (active.length === 0) return null;

  return (
    <Stack gap={4}>
      {active.map((currency) => {
        const book = balances[currency];
        const settlements = suggestSettlements(book);
        const sorted = Object.entries(book).sort((a, b) => b[1] - a[1]);

        return (
          <Card key={currency}>
            <CardHeader
              title={`Balances — ${currency}`}
              hint="Derived from every unsettled split. Never mixed with other currencies."
            />
            <div className="divide-y divide-rule">
              {sorted.map(([userId, amount]) => (
                <div
                  key={userId}
                  className="flex items-center justify-between px-4 py-2.5 text-sm"
                >
                  <span>{name(userId)}</span>
                  <span className="flex items-center gap-2">
                    <span className="nums font-medium">
                      {formatMoney(Math.abs(amount), currency as Currency)}
                    </span>
                    <Badge tone={amount === 0 ? "neutral" : amount > 0 ? "agreed" : "action"}>
                      {amount === 0 ? "Square" : amount > 0 ? "Owed back" : "Owes"}
                    </Badge>
                  </span>
                </div>
              ))}
            </div>

            {settlements.length > 0 ? (
              <div className="border-t border-rule px-4 py-3">
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.06em] text-ink-soft">
                  Suggested settle-up
                </p>
                <Stack gap={2}>
                  {settlements.map((s, i) => (
                    <p key={i} className="text-sm text-ink-soft">
                      <span className="font-medium text-ink">{name(s.from)}</span> pays{" "}
                      <span className="font-medium text-ink">{name(s.to)}</span>{" "}
                      <span className="nums font-medium text-ink">
                        {formatMoney(s.amountMinor, currency as Currency)}
                      </span>
                    </p>
                  ))}
                </Stack>
                <p className="mt-2 text-xs text-ink-faint">
                  A suggestion only — Waypoint moves no money. Settle up
                  however your group prefers, then mark it paid.
                </p>
              </div>
            ) : null}
          </Card>
        );
      })}
    </Stack>
  );
}
