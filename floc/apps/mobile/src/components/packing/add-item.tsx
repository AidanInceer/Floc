import { PACK_CATEGORIES, PACK_CATEGORY_LABELS, type PackCategory } from "@floc/core/packing/packing";
import { useState } from "react";
import { View } from "react-native";

import { PlusGlyph } from "../system/glyphs";
import { Body, Button, Card, Dropdown, Field, Segmented } from "../system/ui";
import { space } from "@/lib/theme";

const CATEGORIES = PACK_CATEGORIES.map((value) => ({ value, label: PACK_CATEGORY_LABELS[value] }));

const LISTS = [
  { value: "shared" as const, label: "The group's" },
  { value: "mine" as const, label: "My bag" },
];

export type NewItem = { label: string; category: PackCategory; mine: boolean };

/** Why folded behind one button: the open form put four controls above the bag before a single item showed. */
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
  const [open, setOpen] = useState(false);
  const [list, setList] = useState<"shared" | "mine">("mine");
  const [label, setLabel] = useState("");
  const [category, setCategory] = useState<PackCategory>("essentials");

  if (!open) {
    return <Button label="Add an item" icon={(ink) => <PlusGlyph color={ink} />} onPress={() => setOpen(true)} />;
  }
  return (
    <Card>
      <View style={{ gap: space.md }}>
        <Segmented options={LISTS} value={list} onChange={setList} />
        <Field label="What is it" value={label} onChangeText={setLabel} autoFocus />
        <Dropdown label="Category" options={CATEGORIES} value={category} onChange={setCategory} />
        <View style={{ flexDirection: "row", gap: space.sm }}>
          <View style={{ flex: 1 }}>
            <Button label="Done" variant="quiet" onPress={() => setOpen(false)} />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              label="Add it"
              busy={busy}
              disabled={label.trim() === ""}
              onPress={() => onAdd({ label: label.trim(), category, mine: list === "mine" }, () => setLabel(""))}
            />
          </View>
        </View>
        {error ? <Body tone="red">{error}</Body> : null}
      </View>
    </Card>
  );
}
