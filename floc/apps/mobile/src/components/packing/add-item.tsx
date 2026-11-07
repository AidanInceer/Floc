import { PACK_CATEGORIES, PACK_CATEGORY_LABELS, type PackCategory } from "@floc/core/packing/packing";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ChevronGlyph, PlusGlyph } from "../system/glyphs";
import { useTheme } from "../system/theme";
import { Button, Card, ChoiceSheet, Segmented, TextBox } from "../system/ui";
import { TextAction } from "./line-frame";
import { fonts, radius, size, space } from "@/lib/theme";

const CATEGORIES = PACK_CATEGORIES.map((value) => ({ value, label: PACK_CATEGORY_LABELS[value] }));

const LISTS = [
  { value: "mine" as const, label: "My bag" },
  { value: "shared" as const, label: "The group’s" },
];

export type NewItem = { label: string; category: PackCategory; mine: boolean };

/**
 * Why a quiet row that opens in place: the open form put four controls above the bag before a single item showed.
 * The name leads and Return adds, so a second item follows without lifting the thumb.
 */
export function AddItem({
  busy,
  error,
  onAdd,
}: {
  busy: boolean;
  error: string | null;
  /** `done` clears the name, so a second item can follow without reopening. */
  onAdd: (item: NewItem, done: () => void) => void;
}) {
  const { c } = useTheme();
  const [open, setOpen] = useState(false);
  const [picking, setPicking] = useState(false);
  const [list, setList] = useState<"shared" | "mine">("mine");
  const [label, setLabel] = useState("");
  const [category, setCategory] = useState<PackCategory>("essentials");
  const ready = label.trim() !== "";
  const submit = () => {
    if (ready && !busy) onAdd({ label: label.trim(), category, mine: list === "mine" }, () => setLabel(""));
  };

  if (!open) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add an item"
        onPress={() => setOpen(true)}
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          gap: space.sm,
          minHeight: 48,
          paddingHorizontal: space.md,
          borderRadius: radius.md,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: c.rule,
          backgroundColor: c.sheet,
          opacity: pressed ? 0.6 : 1,
        })}
      >
        <PlusGlyph color={c.pen} />
        <Text style={{ color: c.pen, fontFamily: fonts.sansBold, fontSize: size.body }}>Add an item</Text>
      </Pressable>
    );
  }
  return (
    <Card style={{ padding: space.md, gap: space.md }}>
      <TextBox
        label="What is it"
        value={label}
        onChangeText={setLabel}
        autoFocus
        returnKeyType="done"
        onSubmitEditing={submit}
      />
      <Segmented options={LISTS} value={list} onChange={setList} />
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Category: ${PACK_CATEGORY_LABELS[category]}`}
          onPress={() => setPicking(true)}
          hitSlop={8}
          style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: space.xs }}
        >
          <Text numberOfLines={1} style={{ color: c["ink-2"], fontFamily: fonts.sans, fontSize: size.small, flexShrink: 1 }}>
            {PACK_CATEGORY_LABELS[category]}
          </Text>
          <ChevronGlyph color={c["ink-3"]} />
        </Pressable>
        <TextAction label="Done" onPress={() => setOpen(false)} />
        <Button label="Add" fit="small" busy={busy} disabled={!ready} onPress={submit} />
      </View>
      {error ? <Text style={{ color: c.red, fontFamily: fonts.sans, fontSize: size.small }}>{error}</Text> : null}
      <ChoiceSheet
        title="Category"
        open={picking}
        onClose={() => setPicking(false)}
        options={CATEGORIES}
        value={category}
        onChange={setCategory}
      />
    </Card>
  );
}
