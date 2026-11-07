import type { LiveStatus } from "@floc/core/notes/live/live-status";
import { LIVE_STATUS_WORDS } from "@floc/core/notes/live/live-status";
import type { PresentPerson } from "@floc/core/notes/live/live-presence";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { PresenceRow } from "@/components/notes/live-presence";
import { ChevronGlyph, FileGlyph } from "@/components/system/glyphs";
import { useTheme } from "@/components/system/theme";
import { fonts, radius, size, space } from "@/lib/theme";

export function NotesBar({ pageCount, status, people, onPages }: {
  pageCount: number;
  status: LiveStatus;
  people: PresentPerson[];
  onPages: () => void;
}) {
  const { c } = useTheme();
  const dot = status === "live" ? c["pastel-green-ink"] : status === "saving" ? c["pastel-yellow-ink"] : c["ink-3"];
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: space.md,
        paddingLeft: space.lg,
        paddingRight: space.lg,
        backgroundColor: c.sheet,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: c.rule,
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Pages, ${pageCount}`}
        onPress={onPages}
        hitSlop={{ top: 4, bottom: 4 }}
        style={({ pressed }) => ({
          flex: 1,
          minWidth: 0,
          minHeight: 44,
          flexDirection: "row",
          alignItems: "center",
          gap: space.sm,
          opacity: pressed ? 0.6 : 1,
        })}
      >
        <FileGlyph color={c["ink-2"]} />
        <Text style={{ color: c.ink, fontFamily: fonts.sansBold, fontSize: size.body }}>Pages</Text>
        <Text style={{ color: c["ink-3"], fontFamily: fonts.type, fontSize: size.small, fontVariant: ["tabular-nums"] }}>{pageCount}</Text>
        <ChevronGlyph color={c["ink-3"]} />
      </Pressable>
      <PresenceRow people={people} />
      <View accessible accessibilityLabel={LIVE_STATUS_WORDS[status]} style={{ flexDirection: "row", alignItems: "center", gap: space.xs }}>
        <View style={{ width: 6, height: 6, borderRadius: radius.pill, backgroundColor: dot }} />
        <Text style={{ color: c["ink-3"], fontFamily: fonts.sans, fontSize: size.small }}>{LIVE_STATUS_WORDS[status]}</Text>
      </View>
    </View>
  );
}
