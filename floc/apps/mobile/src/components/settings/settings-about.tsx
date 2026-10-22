// Why: the seed list is short enough to lay out whole, so no picker sheet and
// no search — ten pills, and tapping one is the write (#46, #236).
import { VIBE_TAGS } from "@floc/core/trip/vibe-tags";
import { StyleSheet, Pressable, Text, View } from "react-native";

import { useTheme } from "../system/theme";
import { Label } from "../system/ui";
import { fonts, radius, size, space } from "@/lib/theme";

/** One tag, on or off. Filled when on, and the word is always there (#204). */
function TagPill({
  tag,
  on,
  onPress,
}: {
  tag: string;
  on: boolean;
  onPress: () => void;
}) {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: on }}
      accessibilityLabel={tag}
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: on ? c["pastel-blue"] : c.sheet,
        borderColor: on ? c["pastel-blue-edge"] : c.rule,
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: radius.pill,
        paddingVertical: space.xs,
        paddingHorizontal: space.md,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Text
        style={{
          color: on ? c["pastel-blue-ink"] : c["ink-2"],
          fontFamily: on ? fonts.sansBold : fonts.sans,
          fontSize: size.small,
        }}
      >
        {tag}
      </Text>
    </Pressable>
  );
}

export function SettingsVibeTags({
  tags,
  onChange,
}: {
  tags: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <View style={{ gap: space.sm }}>
      <Label>Vibe tags</Label>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.xs }}>
        {VIBE_TAGS.map((tag) => (
          <TagPill
            key={tag}
            tag={tag}
            on={tags.includes(tag)}
            onPress={() =>
              onChange(tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag])
            }
          />
        ))}
      </View>
    </View>
  );
}
