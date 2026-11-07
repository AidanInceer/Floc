/** Shared or Yours, as the web splits them: a head with its note, then one card of rows or the one sentence that says what goes here. */
import type { ReactNode } from "react";
import { Text, View } from "react-native";

import { useTheme } from "../system/theme";
import { Card, SectionTitle } from "../system/ui";
import { fonts, size, space } from "@/lib/theme";

export function FileCard({
  title,
  note,
  empty,
  count,
  action,
  children,
}: {
  title: string;
  note: string;
  empty: string;
  count: number;
  action?: ReactNode;
  children: ReactNode;
}) {
  const { c } = useTheme();
  const words = { color: c["ink-3"], fontFamily: fonts.sans, fontSize: size.small };
  return (
    <View style={{ gap: space.sm }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
        <SectionTitle>{title}</SectionTitle>
        <Text numberOfLines={1} style={[words, { flex: 1 }]}>
          {note}
        </Text>
        {action}
      </View>
      {count > 0 ? (
        <Card style={{ padding: 0, gap: 0, overflow: "hidden" }}>{children}</Card>
      ) : (
        <Card style={{ paddingVertical: space.md, gap: 0 }}>
          <Text style={words}>{empty}</Text>
        </Card>
      )}
    </View>
  );
}
