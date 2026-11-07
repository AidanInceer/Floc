import { sortIdeas, type IdeaRow } from "@floc/core/trip/ideas";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { BulbGlyph, ChevronGlyph } from "../../system/glyphs";
import { useTheme } from "../../system/theme";
import { fonts, radius, size, space } from "@/lib/theme";

/** Why: the web's closed Ideas row — count and the top idea on one line; with none, one quiet line that says what goes here. */
export function IdeasClosedRow({ ideas, onOpen }: { ideas: IdeaRow[]; onOpen: () => void }) {
  const { c } = useTheme();
  const [top] = sortIdeas(ideas, "votes");
  const count = ideas.length === 1 ? "1 idea" : `${ideas.length} ideas`;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={top ? `${count}. Top: ${top.title}. Open ideas` : "Add an idea for the group to vote on"}
      onPress={onOpen}
      style={({ pressed }) => ({
        minHeight: 52,
        flexDirection: "row",
        alignItems: "center",
        gap: space.md,
        paddingHorizontal: space.lg,
        paddingVertical: space.sm,
        backgroundColor: c.sheet,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: c.rule,
        borderRadius: radius.md,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <BulbGlyph color={c["pastel-yellow-ink"]} />
      <View style={{ flex: 1 }}>
        {top ? (
          <>
            <Text style={{ color: c.ink, fontFamily: fonts.sans, fontSize: size.body }}>{count}</Text>
            <Text numberOfLines={1} style={{ color: c["ink-3"], fontFamily: fonts.sans, fontSize: size.small }}>{`Top: ${top.title}`}</Text>
          </>
        ) : (
          <Text style={{ color: c["ink-3"], fontFamily: fonts.sans, fontSize: size.small }}>Add an idea for the group to vote on</Text>
        )}
      </View>
      <View style={{ transform: [{ rotate: "-90deg" }] }}>
        <ChevronGlyph color={c["ink-3"]} />
      </View>
    </Pressable>
  );
}
