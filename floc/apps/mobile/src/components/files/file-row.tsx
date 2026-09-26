/**
 * One file, on one line (#325 feedback) — the shape the web's list already has.
 *
 * A CARD PER FILE WAS TOO MUCH. Each one carried a name, a filing dropdown and
 * a Remove button, so three files filled the screen and the pile could not be
 * read at a glance. The line says what the file is; everything you can do to it
 * waits behind the dots, the way the web keeps it behind a row menu.
 *
 * THE NAME OPENS THE FILE, the dots open what you can do to it — the same two
 * targets the browser's row has, so a tap means the same thing on both.
 *
 * "PRIVATE" MEANS ONLY YOU. The API never sends somebody else's private file,
 * so a row that arrives here is the viewer's to see.
 */
import { DOC_CATEGORY_LABELS, type DocCategory } from "@floc/core/documents/documents";
import { Pressable, StyleSheet, View } from "react-native";

import { MoreGlyph } from "../system/glyphs";
import { useTheme } from "../system/theme";
import { Body, Figure, IconButton, Pill } from "../system/ui";
import { space } from "@/lib/theme";

export function FileRow({
  name,
  uploaderName,
  category,
  own,
  onOpen,
  onActions,
}: {
  name: string;
  uploaderName: string;
  category: DocCategory;
  own: boolean;
  onOpen: () => void;
  onActions: () => void;
}) {
  const { c } = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: space.sm,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: c.rule,
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open ${name}`}
        onPress={onOpen}
        style={({ pressed }) => ({
          flex: 1,
          gap: 2,
          paddingVertical: space.sm,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Body bold tone="pen">
          {name}
        </Body>
        <Figure tone="ink-2">
          {uploaderName} · {DOC_CATEGORY_LABELS[category]}
        </Figure>
      </Pressable>
      {own ? <Pill word="Private" tone="pastel-blue" /> : null}
      <IconButton label={`What to do with ${name}`} onPress={onActions}>
        {(color) => <MoreGlyph color={color} />}
      </IconButton>
    </View>
  );
}
