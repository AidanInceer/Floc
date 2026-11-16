import { Pressable, StyleSheet, Text, View } from "react-native";

import { PenGlyph } from "./glyphs";
import { useTheme } from "./theme";
import { fonts, radius, size, space } from "@/lib/theme";
import { Face } from "./face";

export function ProfileFace({
  name,
  been,
  wantToGo,
  vibeTags,
  onEdit,
}: {
  name: string;
  been: number;
  wantToGo: number;
  vibeTags: string[];
  onEdit: () => void;
}) {
  const { c } = useTheme();

  return (
    <View
      style={{
        backgroundColor: c.sheet,
        borderColor: c.rule,
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: radius.md,
        padding: space.lg,
        gap: space.md,
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Change your name — ${name}`}
        testID="edit-face"
        onPress={onEdit}
        style={{ flexDirection: "row", alignItems: "center", gap: space.md }}
      >
        <View>
          <Face name={name} look="profile" />
          <View
            style={{
              position: "absolute",
              right: -2,
              bottom: -2,
              width: 22,
              height: 22,
              borderRadius: radius.sm,
              backgroundColor: c.sheet,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: c["rule-2"],
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <PenGlyph color={c["ink-2"]} size={11} />
          </View>
        </View>
        <View style={{ flex: 1, gap: space.xs }}>
          <Text
            numberOfLines={1}
            style={{
              color: c.ink,
              fontFamily: fonts.display,
              fontSize: size.heading,
            }}
          >
            {name}
          </Text>
          <Text
            style={{
              color: c["ink-3"],
              fontFamily: fonts.type,
              fontSize: size.small,
              fontVariant: ["tabular-nums"],
            }}
          >
            {been} been · {wantToGo} want to go
          </Text>
        </View>
      </Pressable>

      {vibeTags.length > 0 ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.xs }}>
          {vibeTags.map((tag) => (
            <View
              key={tag}
              style={{
                backgroundColor: c.paper,
                borderColor: c.rule,
                borderWidth: StyleSheet.hairlineWidth,
                borderRadius: radius.pill,
                paddingVertical: 2,
                paddingHorizontal: space.sm,
              }}
            >
              <Text style={{ color: c["ink-2"], fontFamily: fonts.sans, fontSize: size.small }}>
                {tag}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
