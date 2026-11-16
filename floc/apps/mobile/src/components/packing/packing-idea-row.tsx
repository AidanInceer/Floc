import { Text } from "react-native";

import { PlusGlyph } from "../system/glyphs";
import { useTheme } from "../system/theme";
import { GhostIcon, LineFrame } from "./line-frame";
import { fonts, size } from "@/lib/theme";

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
    <LineFrame
      lead={
        <GhostIcon label={`Add ${idea.label} to my bag`} disabled={busy} tone="pen" onPress={onTake}>
          {(color) => <PlusGlyph color={color} />}
        </GhostIcon>
      }
    >
      <Text style={{ color: c["ink-3"], fontFamily: fonts.sans, fontSize: size.body }}>
        {`${idea.quantity} — ${idea.label}`}
      </Text>
    </LineFrame>
  );
}
