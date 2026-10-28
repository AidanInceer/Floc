/**
 * One auto packing idea at the foot of a cube (#469). Faint, so it never reads
 * as packed or owned; the + takes it into your bag, marked suggested.
 */
import { View } from "react-native";

import { PlusGlyph } from "../system/glyphs";
import { useTheme } from "../system/theme";
import { Body, IconButton, Row } from "../system/ui";
import { space } from "@/lib/theme";

export function IdeaRow({
  idea,
  busy,
  onTake,
}: {
  idea: { label: string; quantity: number };
  busy: boolean;
  onTake: () => void;
}) {
  const { c } = useTheme();
  return (
    <Row>
      <View style={{ width: 34 }}>
        <IconButton label={`Add ${idea.label} to my bag`} disabled={busy} onPress={onTake}>
          {() => <PlusGlyph color={c.pen} />}
        </IconButton>
      </View>
      <View style={{ flex: 1, flexDirection: "row", gap: space.xs }}>
        <Body tone="ink-3">{`${idea.quantity} — ${idea.label}`}</Body>
      </View>
    </Row>
  );
}
