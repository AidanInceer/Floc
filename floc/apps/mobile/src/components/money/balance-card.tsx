import { formatMoney } from "@floc/core/money/money";
import type { SettleRow } from "@floc/core/money/group-settle";
import { settleSides, SETTLE_OTHERS_TITLE, SETTLE_OWE_TITLE, SETTLE_OWED_TITLE } from "@floc/core/money/settle-words";
import { whoTone } from "@floc/core/people/who";
import type { ReactNode } from "react";
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
  nudgeFor?: (userId: string) => ReactNode;
};

function PayRow({ row, paying, nameOf, busy, onSettle, nudgeFor }: { row: SettleRow; paying: boolean } & Omit<Props, "rows" | "viewerId">) {
  const { c } = useTheme();
  const who = nameOf(paying ? row.payee : row.payer);
  const tone = whoTone(who);
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: space.md, paddingVertical: space.sm }}>
      <Face name={who} tone={tone} look="seat" />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={{ color: c.ink, fontFamily: fonts.sansBold, fontSize: size.small }}>{who}</Text>
        {paying ? null : <View style={{ alignSelf: "flex-start" }}>{nudgeFor?.(row.payer)}</View>}
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

export function BalanceCard({ rows, viewerId, nameOf, busy, onSettle, nudgeFor }: Props) {
  const { c } = useTheme();
  if (rows.length === 0) {
    return (
      <Card style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
        <Text style={{ flex: 1, color: c["pastel-green-ink"], fontFamily: fonts.sansBold, fontSize: size.body }}>All settled up</Text>
        <Text style={{ color: c["ink-2"], fontFamily: fonts.sans, fontSize: size.small }}>Everyone is square</Text>
      </Card>
    );
  }
  const { owe, owed, others } = settleSides(rows, viewerId);
  const key = (r: SettleRow) => `${r.payer}-${r.payee}`;
  return (
    <Card style={{ padding: 0, gap: 0, overflow: "hidden" }}>
      <Part first title={SETTLE_OWE_TITLE}empty="Nothing. You're square.">
        {owe.map((r) => <PayRow key={key(r)} row={r} paying nameOf={nameOf} busy={busy} onSettle={onSettle} />)}
      </Part>
      <Part title={SETTLE_OWED_TITLE}empty="Nothing to chase.">
        {owed.map((r) => <PayRow key={key(r)} row={r} paying={false} nameOf={nameOf} busy={busy} onSettle={onSettle} nudgeFor={nudgeFor} />)}
      </Part>
      {others.length > 0 ? (
        <View style={{ backgroundColor: c["sheet-2"], borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.rule, paddingHorizontal: space.lg, paddingVertical: space.md, gap: space.sm }}>
          <Text accessibilityRole="header" style={{ color: c["ink-2"], fontFamily: fonts.sansBold, fontSize: size.small }}>{SETTLE_OTHERS_TITLE}</Text>
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
