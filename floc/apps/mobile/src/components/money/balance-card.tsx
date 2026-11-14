/**
 * The top of Money (#463): the group's fewest payments, in your currency, on one surface. Yours first,
 * each settled in one payment; then a grey band with the payments between other people, which only
 * those two can mark paid.
 */
import { formatMoney } from "@floc/core/money/money";
import type { SettleRow } from "@floc/core/money/group-settle";
import { whoTone } from "@floc/core/people/who";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../system/theme";
import { Button, Card, SectionTitle } from "../system/ui";
import { fonts, size, space } from "@/lib/theme";
import { Face } from "../system/face";

type Props = {
  rows: SettleRow[];
  viewerId: string | undefined;
  nameOf: (userId: string) => string;
  busy: boolean;
  onSettle: (row: SettleRow) => void;
};

function PayRow({ row, paying, nameOf, busy, onSettle }: { row: SettleRow; paying: boolean } & Omit<Props, "rows" | "viewerId">) {
  const { c } = useTheme();
  const who = nameOf(paying ? row.payee : row.payer);
  const tone = whoTone(who);
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: space.md, paddingVertical: space.sm }}>
      <Face name={who} tone={tone} look="seat" />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={{ color: c.ink, fontFamily: fonts.sansBold, fontSize: size.small }}>{who}</Text>
        <Text style={{ color: paying ? c.red : c["pastel-green-ink"], fontFamily: fonts.type, fontSize: size.body + 2, fontVariant: ["tabular-nums"] }}>
          {formatMoney(row.amountMinor, row.currency)}
        </Text>
      </View>
      <Button label={paying ? "Settle up" : "Mark paid"} variant={paying ? "primary" : "quiet"} fit="small" busy={busy} onPress={() => onSettle(row)} />
    </View>
  );
}

function Part({ title, empty, children, first }: { title: string; empty: string; children: React.ReactNode[]; first?: boolean }) {
  const { c } = useTheme();
  return (
    <View style={{ paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: space.sm, borderTopWidth: first ? 0 : StyleSheet.hairlineWidth, borderTopColor: c.rule }}>
      <SectionTitle>{title}</SectionTitle>
      {children.length > 0 ? children : <Text style={{ color: c["ink-2"], fontFamily: fonts.sans, fontSize: size.small, paddingVertical: space.sm }}>{empty}</Text>}
    </View>
  );
}

export function BalanceCard({ rows, viewerId, nameOf, busy, onSettle }: Props) {
  const { c } = useTheme();
  if (rows.length === 0) {
    return (
      <Card style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
        <Text style={{ flex: 1, color: c["pastel-green-ink"], fontFamily: fonts.sansBold, fontSize: size.body }}>All settled up</Text>
        <Text style={{ color: c["ink-2"], fontFamily: fonts.sans, fontSize: size.small }}>Everyone is square</Text>
      </Card>
    );
  }
  const owe = rows.filter((r) => r.payer === viewerId);
  const owed = rows.filter((r) => r.payee === viewerId);
  const others = rows.filter((r) => r.payer !== viewerId && r.payee !== viewerId);
  const key = (r: SettleRow) => `${r.payer}-${r.payee}`;
  return (
    <Card style={{ padding: 0, gap: 0, overflow: "hidden" }}>
      <Part first title="You owe" empty="Nothing. You're square.">
        {owe.map((r) => <PayRow key={key(r)} row={r} paying nameOf={nameOf} busy={busy} onSettle={onSettle} />)}
      </Part>
      <Part title="You are owed" empty="Nothing to chase.">
        {owed.map((r) => <PayRow key={key(r)} row={r} paying={false} nameOf={nameOf} busy={busy} onSettle={onSettle} />)}
      </Part>
      {others.length > 0 ? (
        <View style={{ backgroundColor: c["sheet-2"], borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.rule, paddingHorizontal: space.lg, paddingVertical: space.md, gap: space.sm }}>
          <Text accessibilityRole="header" style={{ color: c["ink-2"], fontFamily: fonts.sansBold, fontSize: size.small }}>Between the others</Text>
          {others.map((r) => (
            <View key={key(r)} style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
              <Text numberOfLines={1} style={{ flex: 1, color: c["ink-2"], fontFamily: fonts.sans, fontSize: size.small }}>
                {`${nameOf(r.payer)} owes ${nameOf(r.payee)}`}
              </Text>
              <Text style={{ color: c["ink-2"], fontFamily: fonts.type, fontSize: size.small, fontVariant: ["tabular-nums"] }}>{formatMoney(r.amountMinor, r.currency)}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </Card>
  );
}
