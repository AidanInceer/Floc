/**
 * One saved packing list, with its things (ticket 230).
 *
 * BUILT FROM THE PACKING ROWS, ON PURPOSE. A saved list and a bag are the same
 * object at two moments, so one of them looking like a settings form and the
 * other like a checklist would be two designs for one idea.
 *
 * RENAME IS BEHIND THE NAME. Tapping the heading opens the field — the same
 * move the profile card and the trip header make. A rename is rare, and a
 * permanent form for a rare job is furniture.
 *
 * DELETING A LIST IS NOT DELETING A BAG. Bags already filled from it keep
 * their things: a kit is a stencil, not a source.
 */
import { PACK_CATEGORY_LABELS, type PackCategory } from "@floc/core/packing";
import { useState } from "react";
import { Alert, Pressable, View } from "react-native";

import { CrossGlyph, MinusGlyph, PlusGlyph } from "./glyphs";
import { Body, Button, Card, Empty, Field, Figure, IconButton, Label } from "./ui";
import { space } from "@/lib/theme";

export type KitItem = {
  id: number;
  label: string;
  category: PackCategory;
  quantity: number;
};

export type SavedKit = { id: number; name: string; items: KitItem[] };

export function KitCard({
  kit,
  busy,
  onRename,
  onAdd,
  onDelete,
  onStepItem,
  onRemoveItem,
}: {
  kit: SavedKit;
  busy: boolean;
  onRename: (name: string) => void;
  onAdd: () => void;
  onDelete: () => void;
  onStepItem: (itemId: number, delta: 1 | -1) => void;
  onRemoveItem: (itemId: number) => void;
}) {
  const [name, setName] = useState<string | null>(null);

  return (
    <Card>
      {name === null ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Rename ${kit.name}`}
          onPress={() => setName(kit.name)}
          style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}
        >
          <View style={{ flex: 1 }}>
            <Body bold>{kit.name}</Body>
          </View>
          <Figure tone="ink-3">
            {kit.items.length === 1 ? "1 thing" : `${kit.items.length} things`}
          </Figure>
          <IconButton
            label={`Delete ${kit.name}`}
            tone="danger"
            disabled={busy}
            onPress={() =>
              Alert.alert(
                `Delete "${kit.name}"?`,
                "Bags you've already filled from it keep their things.",
                [
                  { text: "Keep it", style: "cancel" },
                  { text: "Delete it", style: "destructive", onPress: onDelete },
                ],
              )
            }
          >
            {(color) => <CrossGlyph color={color} />}
          </IconButton>
        </Pressable>
      ) : (
        <Field
          label="List name"
          value={name}
          autoFocus
          onChangeText={setName}
          onBlur={() => {
            const next = name.trim();
            if (next && next !== kit.name) onRename(next);
            setName(null);
          }}
        />
      )}

      {kit.items.length === 0 ? (
        <Empty>Nothing in it yet.</Empty>
      ) : (
        kit.items.map((item) => (
          <View
            key={item.id}
            style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}
          >
            <View style={{ flex: 1 }}>
              <Body>{item.label}</Body>
              <Label>{PACK_CATEGORY_LABELS[item.category]}</Label>
            </View>
            <IconButton
              label={`One fewer ${item.label}`}
              disabled={busy || item.quantity <= 1}
              onPress={() => onStepItem(item.id, -1)}
            >
              {(color) => <MinusGlyph color={color} />}
            </IconButton>
            <Figure>{item.quantity}</Figure>
            <IconButton
              label={`One more ${item.label}`}
              disabled={busy}
              onPress={() => onStepItem(item.id, 1)}
            >
              {(color) => <PlusGlyph color={color} />}
            </IconButton>
            <IconButton
              label={`Remove ${item.label}`}
              tone="danger"
              disabled={busy}
              onPress={() => onRemoveItem(item.id)}
            >
              {(color) => <CrossGlyph color={color} />}
            </IconButton>
          </View>
        ))
      )}

      <Button label="Add something" variant="quiet" disabled={busy} onPress={onAdd} />
    </Card>
  );
}
