/**
 * Your saved kits: make one from this bag, apply one, throw one away (ticket 230).
 *
 * THE BAG IS THE EDITOR. The web builds a kit on its own screen, item by item.
 * The phone does not need that screen, because the bag already on the trip is
 * the same list — so a kit is made by naming what is in front of you. That is
 * one field and one press, not a second list-builder.
 *
 * SO THE PRESS IS NEVER DEAD. It used to be greyed with "saved kits are made on
 * the website" underneath, which is a control explaining why it is not one.
 * With no kits, this sheet is still the place you make your first.
 *
 * APPLYING IS ADDITIVE AND IDEMPOTENT. A label already in the bag is left alone,
 * so pressing twice never doubles a row you had tuned. That rule lives on the
 * host; nothing here restates it.
 *
 * DELETING A KIT IS NOT DELETING A BAG. Bags already filled from it keep their
 * rows — a kit is a stencil, not a source.
 */
import { useState } from "react";
import { Pressable, View } from "react-native";

import { CrossGlyph } from "./glyphs";
import { useTheme } from "./theme";
import { Body, Button, Empty, Field, Label, Row } from "./ui";
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
  /** What naming this bag would capture. Nought means there is nothing to save. */
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
        <Label>Save this bag as a kit</Label>
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
        {/* An empty bag is why the press does nothing, and no drawing says it (#126). */}
        {bagSize === 0 ? <Body tone="ink-3">Your bag is empty, so there is nothing to save.</Body> : null}
      </View>

      <View style={{ gap: space.sm }}>
        <Label>Your kits</Label>
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
              {/* The count is the whole reason to pick one kit over another. */}
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
