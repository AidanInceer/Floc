import { useState } from "react";
import { Pressable, View } from "react-native";

import { CrossGlyph } from "../system/glyphs";
import { useTheme } from "../system/theme";
import { Body, Button, Empty, Field, Label, Row, SectionTitle } from "../system/ui";
import { space } from "@/lib/theme";

export type PackingKit = { id: number; name: string; itemCount: number };

export function PackingKitSheet({
  kits,
  bagSize,
  busy,
  error,
  onApply,
  onSave,
  onDelete,
}: {
  kits: PackingKit[];
  bagSize: number;
  busy: boolean;
  error: string | null;
  onApply: (kitId: number) => void;
  onSave: (name: string) => void;
  onDelete: (kitId: number) => void;
}) {
  const { c } = useTheme();
  const [name, setName] = useState("");

  return (
    <View style={{ padding: space.lg, gap: space.md }}>
      <View style={{ gap: space.sm }}>
        <SectionTitle>Save this bag as a kit</SectionTitle>
        <Field label="Kit name" value={name} onChangeText={setName} />
        <Button
          label={bagSize === 1 ? "Save 1 thing" : `Save ${bagSize} things`}
          busy={busy}
          onPress={() => {
            const next = name.trim();
            if (next === "" || bagSize === 0) return;
            onSave(next);
            setName("");
          }}
        />
        {bagSize === 0 ? <Body tone="ink-3">Your bag is empty, so there is nothing to save.</Body> : null}
      </View>

      <View style={{ gap: space.sm }}>
        <SectionTitle>Your kits</SectionTitle>
        {kits.length === 0 ? <Empty>No kits yet.</Empty> : null}
        {kits.map((kit) => (
          <Row key={kit.id}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Apply ${kit.name}, ${kit.itemCount} things`}
              accessibilityState={{ busy }}
              disabled={busy}
              onPress={() => onApply(kit.id)}
              style={{ flex: 1, gap: space.xs, opacity: busy ? 0.5 : 1 }}
            >
              <Body bold>{kit.name}</Body>
              <Label>{kit.itemCount === 1 ? "1 thing" : `${kit.itemCount} things`}</Label>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Delete ${kit.name}`}
              disabled={busy}
              hitSlop={8}
              onPress={() => onDelete(kit.id)}
            >
              <CrossGlyph color={c["ink-3"]} />
            </Pressable>
          </Row>
        ))}
      </View>

      {error ? <Body tone="red">{error}</Body> : null}
    </View>
  );
}
