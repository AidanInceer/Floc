import type { NudgePerson, NudgeTask } from "@floc/core/trip/nudge/nudge";
import { Pressable, Text, View } from "react-native";

import { TickGlyph } from "../../system/glyphs";
import { useTheme } from "../../system/theme";
import { fonts, size, space } from "@/lib/theme";
import { useNudge } from "./use-nudge";

export function NudgedMark() {
  const { c } = useTheme();
  return (
    <View accessible accessibilityLabel="Nudged" style={{ flexDirection: "row", alignItems: "center", gap: space.xs }}>
      <TickGlyph color={c["ink-3"]} />
      <Text style={{ color: c["ink-3"], fontFamily: fonts.type, fontSize: size.label }}>Nudged</Text>
    </View>
  );
}

export function NudgeNote({ note }: { note: string | null }) {
  const { c } = useTheme();
  return note ? (
    <Text accessibilityLiveRegion="polite" style={{ color: c["ink-3"], fontFamily: fonts.sans, fontSize: size.label }}>
      {note}
    </Text>
  ) : null;
}

export function NudgeWord({ tripId, task, person }: { tripId: number; task: NudgeTask; person: NudgePerson }) {
  const { c } = useTheme();
  const { busy, note, press } = useNudge(tripId, task);
  if (person.nudged) return <NudgedMark />;
  return (
    <View style={{ alignItems: "flex-end" }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Nudge ${person.name}`}
        accessibilityState={{ busy: busy !== null }}
        disabled={busy !== null}
        hitSlop={10}
        onPress={() => press(person.userId, [person.userId])}
        style={({ pressed }) => ({ minHeight: 34, justifyContent: "center", opacity: busy !== null ? 0.5 : pressed ? 0.6 : 1 })}
      >
        <Text style={{ color: c.pen, fontFamily: fonts.sansBold, fontSize: size.small }}>{busy ? "Nudge…" : "Nudge"}</Text>
      </Pressable>
      <NudgeNote note={note} />
    </View>
  );
}
