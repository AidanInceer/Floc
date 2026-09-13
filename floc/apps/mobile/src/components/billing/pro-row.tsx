/** The web's gold row in the account menu: what you are on, and the way to change it. */
import type { BillingStatus } from "@floc/api/port";
import { Pressable, View } from "react-native";

import { ProStarGlyph } from "../system/glyphs";
import { useTheme } from "../system/theme";
import { Body, Row } from "../system/ui";
import { proView } from "@/lib/billing/pro";
import { space } from "@/lib/theme";

export function ProRow({ status, onPress }: { status: BillingStatus | undefined; onPress: () => void }) {
  const { c } = useTheme();
  if (!status || proView(status).kind !== "pro") return null;

  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Floc Pro" onPress={onPress}>
      <Row>
        <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
          <ProStarGlyph color={c["pro-gold"]} />
          <Body bold>Floc Pro</Body>
        </View>
      </Row>
    </Pressable>
  );
}
