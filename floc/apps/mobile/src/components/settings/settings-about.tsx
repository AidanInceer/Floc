// Why: the seed list is short enough to lay out whole, so no picker sheet and
// no search — ten chips in three groups, and tapping one is the write (#46, #236).
import { VIBE_TAG_GROUPS } from "@floc/core/trip/vibe-tags";
import { StyleSheet, Pressable, Text, View } from "react-native";

import { useTheme } from "../system/theme";
import { Body } from "../system/ui";
import { fonts, radius, size, space } from "@/lib/theme";

/** One tag, on or off. A button, so a rounded square; the pen wash and the weight say it is on (#204). */
function TagChip({
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
        backgroundColor: on ? c["pen-2"] : c.sheet,
        borderColor: on ? c["pen-edge"] : c["rule-2"],
        borderWidth: StyleSheet.hairlineWidth * 2,
        borderRadius: radius.sm,
        paddingVertical: space.xs,
        paddingHorizontal: space.md,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Text
        style={{
          color: on ? c["pen-deep"] : c["ink-2"],
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
    <View style={{ gap: space.md }}>
      {VIBE_TAG_GROUPS.map((group) => (
        <View key={group.name} style={{ gap: space.xs }}>
          <Body tone="ink-3">{group.name}</Body>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.xs }}>
            {group.tags.map((tag) => (
              <TagChip
                key={tag}
                tag={tag}
                on={tags.includes(tag)}
                onPress={() => onChange(tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag])}
              />
            ))}
          </View>
        </View>
      ))}
      <Body tone="ink-3">Shown on your profile to the people you pick in Privacy.</Body>
    </View>
  );
}
