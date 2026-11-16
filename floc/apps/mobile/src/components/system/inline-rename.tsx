import { useRef, useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

import { fonts, radius, size, space } from "@/lib/theme";

import { useTheme } from "./theme";
import { Body } from "./ui";

export function InlineRename({
  value,
  maxLength,
  onSave,
}: {
  value: string;
  maxLength: number;
  onSave: (next: string) => Promise<unknown>;
}) {
  const { c } = useTheme();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    setEditing(false);
    setError(null);
  };

  const saving = useRef(false);
  const commit = async () => {
    if (saving.current) return;
    if (draft.trim() === value || draft.trim() === "") return close();
    saving.current = true;
    setBusy(true);
    try {
      await onSave(draft);
      close();
    } catch (err) {
      setError(err instanceof Error ? err.message : "That name did not save.");
    } finally {
      saving.current = false;
      setBusy(false);
    }
  };

  if (!editing) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Rename ${value}`}
        onPress={() => {
          setDraft(value);
          setEditing(true);
        }}
      >
        <Body bold>{value}</Body>
      </Pressable>
    );
  }

  return (
    <View style={{ gap: space.xs }}>
      <TextInput
        accessibilityLabel={`Rename ${value}`}
        value={draft}
        onChangeText={setDraft}
        maxLength={maxLength}
        autoFocus
        selectTextOnFocus
        editable={!busy}
        returnKeyType="done"
        onSubmitEditing={commit}
        onBlur={commit}
        style={{
          backgroundColor: c.sheet,
          borderColor: error ? c.red : c.pen,
          borderWidth: StyleSheet.hairlineWidth * 2,
          borderRadius: radius.sm,
          paddingHorizontal: space.sm,
          paddingVertical: space.xs,
          color: c.ink,
          fontFamily: fonts.sansBold,
          fontSize: size.body,
        }}
      />
      {error ? <Body tone="red">{error}</Body> : null}
    </View>
  );
}
