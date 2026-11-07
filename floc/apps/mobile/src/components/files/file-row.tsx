/** One file: a category-coloured tile, name, meta line and the dots. The row opens the file; the dots open its actions. */
import { DOC_CATEGORY_LABELS, DOC_CATEGORY_TONES, type DocCategory } from "@floc/core/documents/documents";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { FileGlyph } from "@/components/system/glyphs";
import { MoreGlyph } from "../system/glyphs";
import { useTheme } from "../system/theme";
import { IconButton } from "../system/ui";
import { fonts, radius, size, space } from "@/lib/theme";

export function FileRow({
  name,
  meta,
  category,
  first,
  onOpen,
  onActions,
}: {
  name: string;
  meta: string;
  category: DocCategory;
  first: boolean;
  onOpen: () => void;
  onActions: () => void;
}) {
  const { c } = useTheme();
  const tone = DOC_CATEGORY_TONES[category];
  const ground = tone ? c[`pastel-${tone}`] : c["sheet-3"];
  const ink = tone ? c[`pastel-${tone}-ink`] : c["ink-2"];
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingLeft: space.md,
        paddingRight: space.xs,
        borderTopWidth: first ? 0 : StyleSheet.hairlineWidth,
        borderTopColor: c.rule,
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open ${name}, ${DOC_CATEGORY_LABELS[category]}`}
        onPress={onOpen}
        style={({ pressed }) => ({
          flex: 1,
          minWidth: 0,
          flexDirection: "row",
          alignItems: "center",
          gap: space.md,
          minHeight: 60,
          paddingVertical: space.md,
          opacity: pressed ? 0.6 : 1,
        })}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: radius.sm,
            backgroundColor: ground,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <FileGlyph color={ink} />
        </View>
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Text numberOfLines={2} style={{ color: c.ink, fontFamily: fonts.sansBold, fontSize: size.body }}>
            {name}
          </Text>
          <Text numberOfLines={1} style={{ color: c["ink-3"], fontFamily: fonts.type, fontSize: size.small }}>
            {meta}
          </Text>
        </View>
      </Pressable>
      <IconButton label={`What to do with ${name}`} onPress={onActions}>
        {(color) => <MoreGlyph color={color} />}
      </IconButton>
    </View>
  );
}
