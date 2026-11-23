import { TEXT_CAPS } from "@floc/core/text/text";
import { useState } from "react";
import { Pressable, View } from "react-native";

import { Sheet } from "../../system/sheet";
import { useTheme } from "../../system/theme";
import { Body, Button, Heading, TextBox } from "../../system/ui";
import { space } from "@/lib/theme";

export function IdeaMenuSheet({
  title,
  onClose,
  onRename,
  onRemove,
}: {
  title: string;
  onClose: () => void;
  onRename: (title: string) => void;
  onRemove: () => void;
}) {
  const { c } = useTheme();
  const [draft, setDraft] = useState<string | null>(null);

  if (draft !== null) {
    const save = () => {
      if (!draft.trim()) return;
      onRename(draft.trim());
      onClose();
    };
    return (
      <Sheet open onClose={onClose}>
        <View style={{ paddingHorizontal: space.lg, gap: space.md }}>
          <Heading>Edit name</Heading>
          <TextBox label="Idea name" value={draft} onChangeText={setDraft} maxLength={TEXT_CAPS.ideaTitle} autoFocus onSubmitEditing={save} />
          <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: space.sm }}>
            <Button label="Cancel" fit="small" variant="quiet" onPress={onClose} />
            <Button label="Save" fit="small" disabled={!draft.trim()} onPress={save} />
          </View>
        </View>
      </Sheet>
    );
  }

  const row = (label: string, onPress: () => void, danger?: boolean) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({ paddingVertical: space.md, paddingHorizontal: space.lg, backgroundColor: pressed ? c["sheet-2"] : "transparent" })}
    >
      <Body tone={danger ? "red" : "ink"}>{label}</Body>
    </Pressable>
  );

  return (
    <Sheet open onClose={onClose}>
      <View style={{ paddingHorizontal: space.lg, paddingBottom: space.sm }}>
        <Heading>{title}</Heading>
      </View>
      {row("Edit name", () => setDraft(title))}
      {row("Remove", () => {
        onRemove();
        onClose();
      }, true)}
    </Sheet>
  );
}
